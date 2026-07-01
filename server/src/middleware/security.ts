import type { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import { isProduction } from '../lib/config';
import { sendError } from '../lib/errors';

// ── CORS (origin allow-list) ───────────────────────────────────────────────────────
// Only the configured frontend origin(s) may make credentialed requests. Never a
// wildcard with credentials. Unknown origins get no CORS headers (browser blocks),
// and disallowed preflights are rejected outright. In production the app is
// same-origin, so cross-origin requests should not occur at all — this is defense in
// depth. Local Codespaces behavior is documented in DEPLOYMENT.md.

export function allowedOrigins(): string[] {
  return (process.env.FRONTEND_ORIGIN ?? '')
    .split(',').map(s => s.trim()).filter(Boolean);
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.get('origin');
  const allow = allowedOrigins();
  // Same-origin requests have no Origin header → nothing to do.
  if (!origin) { next(); return; }

  if (allow.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-csrf-token');
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    next();
    return;
  }

  // Disallowed origin: reject preflight explicitly; for actual requests, omit CORS
  // headers (the browser will block the response from being read).
  if (req.method === 'OPTIONS') { sendError(res, 'unauthorized', 'Origin not allowed.'); return; }
  next();
}

// ── Helmet (explicit security headers) ───────────────────────────────────────────
export function helmetMiddleware(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // Built CSS is a self-hosted file; 'unsafe-inline' covers React inline style
        // attributes (e.g. chart bar widths). See DEPLOYMENT.md — a nonce/hash-based
        // policy is the intended tightening once styling is audited.
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(isProduction() ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    // HSTS only meaningful over HTTPS (production/staging behind TLS).
    hsts: isProduction() ? { maxAge: 15552000, includeSubDomains: true, preload: false } : false,
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  });
}

// Permissions-Policy (helmet doesn't set this) — disable powerful features by default.
export function permissionsPolicy(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
}
