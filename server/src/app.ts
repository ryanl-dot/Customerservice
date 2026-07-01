import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth';
import { dataRouter } from './routes/data';
import { sendError } from './lib/errors';
import { audit } from './lib/audit';

export function createApp() {
  const app = express();

  // Secure response headers.
  app.use(helmet());
  // Body + signed-cookie parsing. COOKIE_SECRET signs the session cookie.
  app.use(express.json({ limit: '100kb' }));
  const cookieSecret = process.env.COOKIE_SECRET ?? 'dev-cookie-secret-change-me';
  app.use(cookieParser(cookieSecret));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api', dataRouter);

  // Unknown routes.
  app.use((_req, res) => sendError(res, 'not_found'));

  // Central error handler — never leak stack traces or payloads to the client.
  const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    void next; // 4-arg signature required for Express to treat this as error middleware
    audit('data_modification', {
      actorId: req.auth?.userId, role: req.auth?.role,
      outcome: 'error', ip: req.ip,
      detail: err instanceof Error ? err.name : 'unknown_error',
    });
    sendError(res, 'server_error');
  };
  app.use(errorHandler);

  return app;
}
