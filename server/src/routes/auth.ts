import { Router } from 'express';
import type { SessionInfo } from '../../../shared/auth/session';
import { getUserById, getUserByEmail, publicUser, recordLoginSuccess, recordLoginFailure } from '../lib/users';
import { verifyPassword } from '../lib/passwords';
import { createSession, destroySession, getSession, sessionExpiryIso } from '../lib/sessions';
import { sendError } from '../lib/errors';
import { audit } from '../lib/audit';
import { isProduction } from '../lib/config';
import { SESSION_COOKIE, loginLimiter } from '../middleware/auth';
import { validateBody, z, emailField } from '../lib/validate';

export const authRouter = Router();

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(200),
}).strict();

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
    audit('login_failed', { target: `email:${email}`, outcome: 'denied', ip: req.ip });
    sendError(res, 'unauthenticated', 'Invalid email or password.');
    return;
  }
  if (user.accountStatus === 'disabled') {
    audit('login_failed', { actorId: user.id, target: 'account:disabled', outcome: 'denied', ip: req.ip });
    sendError(res, 'unauthorized', 'This account has been disabled.');
    return;
  }
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    audit('login_failed', { actorId: user.id, target: 'account:locked', outcome: 'denied', ip: req.ip });
    sendError(res, 'unauthorized', 'This account is temporarily locked. Try again later.');
    return;
  }

  const session = await createSession(user.id, { userAgent: req.get('user-agent') ?? undefined, ip: req.ip });
  await recordLoginSuccess(user.id);
  res.cookie(SESSION_COOKIE, session.token, cookieOptions);
  audit('login', { actorId: user.id, role: user.role, outcome: 'success', ip: req.ip });
  const body: SessionInfo = { authenticated: true, user: publicUser(user), expiresAt: sessionExpiryIso(session) };
  res.json(body);
});

authRouter.post('/logout', async (req, res) => {
  const token = req.signedCookies?.[SESSION_COOKIE] as string | undefined;
  const lookup = await getSession(token);
  if (lookup.status === 'ok') {
    audit('logout', { actorId: lookup.session.userId, outcome: 'success', ip: req.ip });
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
  const body: SessionInfo = { authenticated: true, user: publicUser(user), expiresAt: sessionExpiryIso(lookup.session) };
  res.json(body);
});
