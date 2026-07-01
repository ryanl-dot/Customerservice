import type { Request, Response, NextFunction } from 'express';
import { z, type ZodType } from 'zod';
import { sendError } from './errors';

// Centralized request validation using zod. Rejects unknown/malformed fields (schemas
// use .strict()) and returns a safe, generic error — never a stack trace, internal DB
// detail, or the offending value. Validated data replaces req.body/query/params.

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) { sendError(res, 'invalid_request', 'One or more fields are invalid.'); return; }
    req.body = result.data;
    next();
  };
}

// Reusable field schemas with sane length caps.
export const emailField = z.string().trim().toLowerCase().min(3).max(254).email();
export const passwordField = z.string().min(12).max(200);
export const nameField = z.string().trim().min(1).max(120);
export const noteField = z.string().max(5000);
export const tokenField = z.string().min(16).max(200);
export const totpField = z.string().regex(/^\d{6}$/);

export { z };
