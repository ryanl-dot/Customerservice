import { Router } from 'express';
import type { SessionInfo } from '../../../shared/auth/session';
import { findUserById, findUserByEmail, publicUser } from '../lib/users';
import { verifyPassword } from '../lib/passwords';
import { createSession, destroySession, getSession, sessionExpiryIso } from '../lib/sessions';
import { sendError } from '../lib/errors';
import { audit } from '../lib/audit';
import { SESSION_COOKIE, loginLimiter } from '../middleware/auth';

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,                                   // not readable by JS → XSS-resistant
  secure: process.env.NODE_ENV === 'production',    // HTTPS-only in production
  sameSite: 'lax' as const,
  signed: true,
  path: '/',
};

authRouter.post('/login', loginLimiter, (req, res) => {
  const { email, password } = (req.body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    sendError(res, 'invalid_request', 'Email and password are required.');
    return;
  }
  const user = findUserByEmail(email);
  // Generic failure message — do not reveal whether the email exists.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    audit('login_failed', { target: `email:${email}`, outcome: 'denied', ip: req.ip });
    sendError(res, 'unauthenticated', 'Invalid email or password.');
    return;
  }
  const session = createSession(user.id);
  res.cookie(SESSION_COOKIE, session.token, cookieOptions);
  audit('login', { actorId: user.id, role: user.role, outcome: 'success', ip: req.ip });
  const body: SessionInfo = { authenticated: true, user: publicUser(user), expiresAt: sessionExpiryIso(session) };
  res.json(body);
});

authRouter.post('/logout', (req, res) => {
  const token = req.signedCookies?.[SESSION_COOKIE] as string | undefined;
  const lookup = getSession(token);
  if (lookup.status === 'ok') {
    audit('logout', { actorId: lookup.session.userId, outcome: 'success', ip: req.ip });
  }
  destroySession(token);
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.json({ authenticated: false } satisfies SessionInfo);
});

authRouter.get('/session', (req, res) => {
  const token = req.signedCookies?.[SESSION_COOKIE] as string | undefined;
  const lookup = getSession(token);
  if (lookup.status !== 'ok') {
    res.json({ authenticated: false } satisfies SessionInfo);
    return;
  }
  const user = findUserById(lookup.session.userId);
  if (!user) { res.json({ authenticated: false } satisfies SessionInfo); return; }
  const body: SessionInfo = { authenticated: true, user: publicUser(user), expiresAt: sessionExpiryIso(lookup.session) };
  res.json(body);
});
