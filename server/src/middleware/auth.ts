import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import type { Role } from '../../../shared/auth/roles';
import type { PageKey } from '../../../shared/auth/permissions';
import { canAccessPage } from '../../../shared/auth/permissions';
import { getSession, touchSession } from '../lib/sessions';
import { getUserById } from '../lib/users';
import { sendError } from '../lib/errors';
import { reqAudit } from '../lib/audit';

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

// Resolve the signed session cookie → req.auth. Distinguishes expired from missing,
// and denies disabled or locked accounts even with a valid session.
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.signedCookies?.[SESSION_COOKIE] as string | undefined;
    const lookup = await getSession(token);
    if (lookup.status === 'expired') { sendError(res, 'session_expired'); return; }
    if (lookup.status === 'revoked') { sendError(res, 'session_expired', 'Your session is no longer valid. Please sign in again.'); return; }
    if (lookup.status === 'missing') { sendError(res, 'unauthenticated'); return; }

    const user = await getUserById(lookup.session.userId);
    if (!user) { sendError(res, 'unauthenticated'); return; }
    if (user.accountStatus === 'disabled') {
      reqAudit(req, 'unauthorized_route', { actorId: user.id, targetType: 'account', targetId: 'disabled', result: 'denied' });
      sendError(res, 'unauthorized', 'This account has been disabled.'); return;
    }
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      sendError(res, 'unauthorized', 'This account is temporarily locked.'); return;
    }
    // Sessions issued before the last password change are invalid (password change
    // revokes existing sessions). Guards against stale cookies even without cleanup.
    if (lookup.session.createdAt.getTime() < user.passwordChangedAt.getTime()) {
      sendError(res, 'session_expired', 'Your session is no longer valid. Please sign in again.'); return;
    }
    void touchSession(lookup.session.token); // best-effort lastSeen update
    req.auth = { userId: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch {
    sendError(res, 'server_error');
  }
}

// Server-side authorization: the role must be permitted to access the page/resource.
// This is the SECURITY boundary; client route guards are only for usability.
export function requirePage(page: PageKey) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) { sendError(res, 'unauthenticated'); return; }
    if (!canAccessPage(req.auth.role, page)) {
      reqAudit(req, 'unauthorized_route', {
        actorId: req.auth.userId, targetType: 'page', targetId: page, result: 'denied',
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
      reqAudit(req, 'unauthorized_route', {
        actorId: req.auth.userId, targetType: 'roles', targetId: roles.join(','), result: 'denied',
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
