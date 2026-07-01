import express, { type ErrorRequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth';
import { dataRouter } from './routes/data';
import { sendError } from './lib/errors';
import { helmetMiddleware, corsMiddleware, permissionsPolicy } from './middleware/security';
import { issueCsrfToken, requireCsrf } from './middleware/csrf';
import { requestId } from './middleware/requestId';

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

  // CSRF enforcement for all state-changing API requests (safe methods pass through).
  app.use('/api', requireCsrf);

  app.use('/api/auth', authRouter);
  app.use('/api', dataRouter);

  // Unknown API routes → JSON 404 (never SPA HTML).
  app.use('/api', (_req, res) => sendError(res, 'not_found'));

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
