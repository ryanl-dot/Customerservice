import { Router } from 'express';
import type { SessionInfo } from '../../../shared/auth/session';
import { getUserById, getUserByEmail, publicUser, recordLoginSuccess, recordLoginFailure } from '../lib/users';
import { verifyPassword } from '../lib/passwords';
import { createSession, destroySession, getSession, sessionExpiryIso } from '../lib/sessions';
import { sendError } from '../lib/errors';
import { reqAudit, emailAuditId } from '../lib/audit';
import { isProduction, userStore } from '../lib/config';
import { revokeAllForUser } from '../lib/sessions';
import { changePassword } from '../db/repositories/users';
import { createResetToken, consumeResetToken } from '../db/repositories/passwordReset';
import { hashPassword } from '../lib/passwords';
import { SESSION_COOKIE, loginLimiter, requireAuth } from '../middleware/auth';
import { validateBody, z, emailField, passwordField, tokenField, totpField } from '../lib/validate';
import { generateMfaSecret, mfaKeyUri, verifyTotp, roleRequiresMfa } from '../lib/mfa';
import { getMfaSecret, setMfaSecret, enableMfa, disableMfa } from '../db/repositories/users';
import { getMailer, passwordResetMessage } from '../lib/email';
import QRCode from 'qrcode';

export const authRouter = Router();

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(200),
  code: totpField.optional(),
}).strict();

const mfaCodeSchema = z.object({ code: totpField }).strict();

const requestResetSchema = z.object({ email: emailField }).strict();
const resetSchema = z.object({ token: tokenField, newPassword: passwordField }).strict();

// Reset flows require the database store (token table). In JSON dev mode they respond
// generically without touching the DB.
function dbMode(): boolean { return isProduction() || userStore() === 'db'; }
const GENERIC_RESET_MSG = 'If an account exists for that email, a reset link has been sent.';

const cookieOptions = {
  httpOnly: true,                 // not readable by JS → XSS-resistant
  secure: isProduction(),         // HTTPS-only in production
  sameSite: 'lax' as const,       // cookie sent on top-level same-site navigations
  signed: true,
  path: '/',
};

authRouter.post('/login', loginLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await getUserByEmail(email);
  // Generic failure message — never reveal whether the email exists.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    if (user) await recordLoginFailure(user.id);
    reqAudit(req, 'login_failed', { targetType: 'email', targetId: emailAuditId(email), result: 'denied' });
    sendError(res, 'unauthenticated', 'Invalid email or password.');
    return;
  }
  if (user.accountStatus === 'disabled') {
    reqAudit(req, 'login_failed', { actorId: user.id, targetType: 'account', targetId: 'disabled', result: 'denied' });
    sendError(res, 'unauthorized', 'This account has been disabled.');
    return;
  }
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    reqAudit(req, 'login_failed', { actorId: user.id, targetType: 'account', targetId: 'locked', result: 'denied' });
    sendError(res, 'unauthorized', 'This account is temporarily locked. Try again later.');
    return;
  }

  // Second factor: enrolled users must present a valid TOTP code. The password was
  // already verified above, so signalling "mfa_required" here does not leak account
  // existence. A full session is created ONLY after the code is verified.
  if (user.mfaEnabled) {
    const { code } = req.body as { code?: string };
    const secret = await getMfaSecret(user.id);
    if (!secret || !code || !(await verifyTotp(code, secret))) {
      reqAudit(req, 'login_failed', { actorId: user.id, targetType: 'mfa', targetId: 'code', result: 'denied' });
      // Machine-readable challenge so the client can reveal the code field. Generic
      // message; does not distinguish wrong vs missing beyond whether a code was sent.
      sendError(res, 'mfa_required', code ? 'Invalid or expired authentication code.' : 'An authentication code is required.');
      return;
    }
  }

  const session = await createSession(user.id, { userAgent: req.get('user-agent') ?? undefined, ip: req.ip });
  await recordLoginSuccess(user.id);
  res.cookie(SESSION_COOKIE, session.token, cookieOptions);
  reqAudit(req, 'login', { actorId: user.id, result: 'success' });
  // Privileged role that hasn't enrolled MFA → session is MFA-pending; the client must
  // route to mandatory enrollment and the server blocks protected endpoints meanwhile.
  const mfaEnrollmentRequired = roleRequiresMfa(user.role) && !user.mfaEnabled;
  const body: SessionInfo = { authenticated: true, user: publicUser(user), expiresAt: sessionExpiryIso(session), mfaEnrollmentRequired };
  res.json(body);
});

authRouter.post('/logout', async (req, res) => {
  const token = req.signedCookies?.[SESSION_COOKIE] as string | undefined;
  const lookup = await getSession(token);
  if (lookup.status === 'ok') {
    reqAudit(req, 'logout', { actorId: lookup.session.userId, result: 'success' });
  }
  await destroySession(token); // server-side revocation
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.json({ authenticated: false } satisfies SessionInfo);
});

authRouter.get('/session', async (req, res) => {
  const token = req.signedCookies?.[SESSION_COOKIE] as string | undefined;
  const lookup = await getSession(token);
  if (lookup.status !== 'ok') {
    res.json({ authenticated: false } satisfies SessionInfo);
    return;
  }
  const user = await getUserById(lookup.session.userId);
  if (!user || user.accountStatus === 'disabled') {
    res.json({ authenticated: false } satisfies SessionInfo);
    return;
  }
  const mfaEnrollmentRequired = roleRequiresMfa(user.role) && !user.mfaEnabled;
  const body: SessionInfo = { authenticated: true, user: publicUser(user), expiresAt: sessionExpiryIso(lookup.session), mfaEnrollmentRequired };
  res.json(body);
});

// Request a password reset. ALWAYS responds generically (never reveals whether the
// email exists). When the user exists, a single-use hashed token is created; the raw
// token is emailed by the (not-yet-connected) mail transport — it is never returned
// in the response or logged. Rate-limited to blunt enumeration/abuse.
authRouter.post('/request-password-reset', loginLimiter, validateBody(requestResetSchema), async (req, res) => {
  const { email } = req.body as { email: string };
  if (dbMode()) {
    const user = await getUserByEmail(email);
    if (user) {
      const { rawToken } = await createResetToken(user.id);
      const base = (process.env.FRONTEND_ORIGIN ?? '').split(',')[0].trim() || process.env.API_ORIGIN || '';
      const resetUrl = `${base}/reset-password?token=${rawToken}`;
      try {
        // Delivered by the configured transport. The raw token/link is NEVER logged.
        await getMailer().send(passwordResetMessage(user.email, resetUrl));
      } catch {
        console.warn('[email] password-reset send failed (transport error).'); // no token/link logged
      }
    }
  }
  res.json({ ok: true, message: GENERIC_RESET_MSG });
});

// Complete a password reset with a single-use token. Generic errors; on success the
// password is changed (bumping passwordChangedAt) and ALL of the user's sessions are
// revoked.
authRouter.post('/reset-password', loginLimiter, validateBody(resetSchema), async (req, res) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  if (!dbMode()) { sendError(res, 'invalid_request', 'Invalid or expired reset token.'); return; }
  const lookup = await consumeResetToken(token);
  if (!lookup) { sendError(res, 'invalid_request', 'Invalid or expired reset token.'); return; }
  await changePassword(lookup.userId, hashPassword(newPassword));
  await revokeAllForUser(lookup.userId);
  reqAudit(req, 'password_changed', { actorId: lookup.userId, targetType: 'user', targetId: lookup.userId, result: 'success' });
  res.json({ ok: true });
});

// ── MFA (TOTP) — authenticated user manages their own second factor ────────────────
// Begin enrollment: generate a secret and return the otpauth URI (for a QR code) to
// the enrolling user only. MFA is not yet active until a code is verified.
authRouter.post('/mfa/enroll', requireAuth, async (req, res) => {
  if (!dbMode()) { sendError(res, 'invalid_request', 'MFA requires the database store.'); return; }
  const secret = generateMfaSecret();
  await setMfaSecret(req.auth!.userId, secret);
  const otpauthUrl = mfaKeyUri(req.auth!.email, secret);
  // Server-rendered QR as a data: URL (CSP allows img-src data:). Secret also returned
  // for manual entry. This is the user's own secret; returned only to them.
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });
  res.json({ secret, otpauthUrl, qrDataUrl });
});

// Confirm enrollment by verifying a code, which enables MFA for the account.
authRouter.post('/mfa/verify', requireAuth, validateBody(mfaCodeSchema), async (req, res) => {
  const { code } = req.body as { code: string };
  const secret = await getMfaSecret(req.auth!.userId);
  if (!secret || !(await verifyTotp(code, secret))) {
    reqAudit(req, 'login_failed', { actorId: req.auth!.userId, targetType: 'mfa', targetId: 'enroll_verify', result: 'denied' });
    sendError(res, 'invalid_request', 'Invalid authentication code.');
    return;
  }
  await enableMfa(req.auth!.userId);
  reqAudit(req, 'config_change', { actorId: req.auth!.userId, targetType: 'mfa', targetId: 'enabled', result: 'success' });
  res.json({ ok: true, mfaEnabled: true });
});

// Disable MFA — requires a valid current code.
authRouter.post('/mfa/disable', requireAuth, validateBody(mfaCodeSchema), async (req, res) => {
  const { code } = req.body as { code: string };
  const secret = await getMfaSecret(req.auth!.userId);
  if (!secret || !(await verifyTotp(code, secret))) { sendError(res, 'invalid_request', 'Invalid authentication code.'); return; }
  await disableMfa(req.auth!.userId);
  reqAudit(req, 'config_change', { actorId: req.auth!.userId, targetType: 'mfa', targetId: 'disabled', result: 'success' });
  res.json({ ok: true, mfaEnabled: false });
});
