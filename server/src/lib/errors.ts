import type { Response } from 'express';
import type { ApiErrorCode, ApiErrorBody } from '../../../shared/api/types';

const STATUS: Record<ApiErrorCode, number> = {
  unauthenticated: 401,
  mfa_required: 401,
  session_expired: 401,
  unauthorized: 403,
  invalid_request: 400,
  not_found: 404,
  rate_limited: 429,
  upstream_unavailable: 503,
  server_error: 500,
};

// Client-safe default messages. Never include stack traces, credentials, SQL,
// upstream payloads, or customer data in an error response.
const SAFE_MESSAGE: Record<ApiErrorCode, string> = {
  unauthenticated: 'Authentication required.',
  mfa_required: 'An authentication code is required.',
  session_expired: 'Your session has expired. Please sign in again.',
  unauthorized: 'You do not have access to this resource.',
  invalid_request: 'The request was invalid.',
  not_found: 'Not found.',
  rate_limited: 'Too many requests. Please try again shortly.',
  upstream_unavailable: 'A required data service is temporarily unavailable.',
  server_error: 'An unexpected error occurred.',
};

export class ApiError extends Error {
  code: ApiErrorCode;
  constructor(code: ApiErrorCode, message?: string) {
    super(message ?? SAFE_MESSAGE[code]);
    this.code = code;
  }
}

export function sendError(res: Response, code: ApiErrorCode, message?: string): void {
  const body: ApiErrorBody = { error: { code, message: message ?? SAFE_MESSAGE[code] } };
  res.status(STATUS[code]).json(body);
}
