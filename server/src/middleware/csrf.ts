import type { Request, Response, NextFunction } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { sendError } from '../lib/errors';
import { isProduction } from '../lib/config';

// CSRF protection via the double-submit-cookie pattern, appropriate for cookie auth.
// A non-httpOnly `csrf_token` cookie is issued on safe requests; the SPA reads it and
// echoes it in the `x-csrf-token` header on state-changing requests. The server
// requires header === cookie. Because a cross-site attacker cannot read the victim's
// cookie (SameSite=Lax + same-origin), they cannot forge the matching header.

export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function csrfCookieOptions() {
  return {
    httpOnly: false,           // MUST be readable by JS so the SPA can echo it
    secure: isProduction(),
    sameSite: 'lax' as const,
    path: '/',
  };
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// Issue a CSRF token cookie if the client doesn't already have one. Safe to call on
// every request; only sets the cookie when missing.
export function issueCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const existing = req.cookies?.[CSRF_COOKIE] as string | undefined;
  if (!existing) {
    res.cookie(CSRF_COOKIE, randomBytes(32).toString('hex'), csrfCookieOptions());
  }
  next();
}

// Enforce CSRF on state-changing methods. Safe methods pass through.
export function requireCsrf(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) { next(); return; }
  const cookie = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const header = req.get(CSRF_HEADER);
  if (!cookie || !header || !constantTimeEqual(cookie, header)) {
    sendError(res, 'invalid_request', 'Invalid or missing CSRF token.');
    return;
  }
  next();
}
