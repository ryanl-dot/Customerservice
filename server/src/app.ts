import path from 'node:path';
import express, { type ErrorRequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth';
import { dataRouter } from './routes/data';
import { sendError } from './lib/errors';
import { helmetMiddleware, corsMiddleware, permissionsPolicy } from './middleware/security';
import { issueCsrfToken, requireCsrf } from './middleware/csrf';
import { requestId } from './middleware/requestId';
import { isProduction, userStore } from './lib/config';
import { getPrisma } from './db/client';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind Render's proxy; needed for correct req.ip / secure cookies

  // Security headers + origin policy.
  app.use(helmetMiddleware());
  app.use(permissionsPolicy);
  app.use(corsMiddleware);

  // Body parsing with a hard size cap, then signed-cookie parsing.
  app.use(express.json({ limit: '100kb' }));
  const cookieSecret = process.env.COOKIE_SECRET ?? 'dev-cookie-secret-change-me';
  app.use(cookieParser(cookieSecret));

  // Correlation id + CSRF token issuance for every request.
  app.use(requestId);
  app.use(issueCsrfToken);

  // Liveness check (safe GET, no CSRF, no auth) for the hosting platform.
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Readiness: verifies the database is reachable when the DB store is active.
  app.get('/api/health/ready', async (_req, res) => {
    const dbActive = isProduction() || userStore() === 'db';
    if (!dbActive) { res.json({ ready: true, db: 'n/a' }); return; }
    try {
      await getPrisma().$queryRaw`SELECT 1`;
      res.json({ ready: true, db: 'up' });
    } catch {
      sendError(res, 'upstream_unavailable', 'Database is unavailable.');
    }
  });

  // CSRF enforcement for all state-changing API requests (safe methods pass through).
  app.use('/api', requireCsrf);

  app.use('/api/auth', authRouter);
  app.use('/api', dataRouter);

  // Unknown API routes → JSON 404 (never SPA HTML).
  app.use('/api', (_req, res) => sendError(res, 'not_found'));

  // ── Same-origin SPA serving (production / SERVE_SPA=1) ─────────────────────────
  // Serves the built React app and falls back to index.html for client routes. API
  // routes are matched above, so they can never be replaced by SPA HTML. Hashed
  // assets are cached long-term; index.html is never cached.
  if (isProduction() || process.env.SERVE_SPA === '1') {
    const dist = path.resolve(process.cwd(), 'dist');
    app.use(express.static(dist, {
      index: false,
      maxAge: '1y',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
      },
    }));
    // SPA fallback for non-API GET requests only.
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // Central error handler — safe response + structured log with request id, never a
  // stack trace, payload, or secret to the client.
  const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    void next; // 4-arg signature required for Express to treat this as error middleware
    console.error(`[error] ${JSON.stringify({
      requestId: req.requestId,
      name: err instanceof Error ? err.name : 'unknown_error',
      path: req.path,
      method: req.method,
    })}`);
    sendError(res, 'server_error');
  };
  app.use(errorHandler);

  return app;
}
