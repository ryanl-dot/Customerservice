import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

// Attaches a correlation id to every request (echoed as x-request-id). Used by audit
// events and error logging so a report can be traced without exposing internals.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { requestId?: string }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.get('x-request-id');
  const id = incoming && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
