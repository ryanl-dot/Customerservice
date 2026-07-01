import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import type { Role } from '../../../shared/auth/roles';
import type { PageKey } from '../../../shared/auth/permissions';
import { canAccessPage } from '../../../shared/auth/permissions';
import { getSession } from '../lib/sessions';
import { findUserById } from '../lib/users';
import { sendError } from '../lib/errors';
import { audit } from '../lib/audit';

export const SESSION_COOKIE = 'solarcs_session';

// Augment Express Request with the authenticated principal.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; role: Role; email: string; name: string };
    }
  }
}

// Resolve the signed session cookie → req.auth. Distinguishes expired from missing.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.signedCookies?.[SESSION_COOKIE] as string | undefined;
  const lookup = getSession(token);
  if (lookup.status === 'expired') { sendError(res, 'session_expired'); return; }
  if (lookup.status === 'missing') { sendError(res, 'unauthenticated'); return; }

  const user = findUserById(lookup.session.userId);
  if (!user) { sendError(res, 'unauthenticated'); return; }
  req.auth = { userId: user.id, role: user.role, email: user.email, name: user.name };
  next();
}

// Server-side authorization: the role must be permitted to access the page/resource.
// This is the SECURITY boundary; client route guards are only for usability.
export function requirePage(page: PageKey) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) { sendError(res, 'unauthenticated'); return; }
    if (!canAccessPage(req.auth.role, page)) {
      audit('unauthorized_route', {
        actorId: req.auth.userId, role: req.auth.role,
        target: `page:${page}`, outcome: 'denied', ip: req.ip,
      });
      sendError(res, 'unauthorized');
      return;
    }
    next();
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) { sendError(res, 'unauthenticated'); return; }
    if (!roles.includes(req.auth.role)) {
      audit('unauthorized_route', {
        actorId: req.auth.userId, role: req.auth.role,
        target: `roles:${roles.join(',')}`, outcome: 'denied', ip: req.ip,
      });
      sendError(res, 'unauthorized');
      return;
    }
    next();
  };
}

// Brute-force protection on login.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => sendError(res, 'rate_limited'),
});
