import type { SessionInfo } from '../../shared/auth/session';
import type { ApiErrorBody, ApiErrorCode } from '../../shared/api/types';

// Typed auth error carrying the server's machine-readable code (e.g. 'mfa_required'),
// so the UI can react to a challenge without string-matching messages.
export class AuthError extends Error {
  code: ApiErrorCode | 'unknown';
  constructor(code: ApiErrorCode | 'unknown', message: string) {
    super(message);
    this.code = code;
  }
}

const UNREACHABLE_MSG = 'Could not reach the server. Make sure the API is running (npm run dev:server) and try again.';

async function toAuthError(res: Response): Promise<AuthError> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return new AuthError(body.error?.code ?? 'unknown', body.error?.message ?? 'Request failed.');
  } catch {
    // Non-JSON response (e.g. the dev proxy couldn't reach the API, or a gateway
    // error page) → the API is unreachable rather than a real auth failure.
    return new AuthError('unknown', UNREACHABLE_MSG);
  }
}

// Wrap fetch so a network-level failure (server down, DNS, CORS) surfaces a clear,
// actionable message instead of a raw "Failed to fetch".
async function safeFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new AuthError('unknown', UNREACHABLE_MSG);
  }
}

// Thin client for the auth API. All calls hit the internal /api boundary (proxied to
// the backend in dev, same-origin in production). No secrets live here — the session
// is an httpOnly cookie the browser sends automatically (credentials: 'include').
//
// Integration-ready seam: to switch to a hosted IdP (Auth0/Clerk/Cognito), replace the
// bodies below with the provider SDK; the AuthProvider contract stays the same.

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.error?.message ?? 'Request failed.';
  } catch {
    return 'Request failed.';
  }
}

// Read the non-httpOnly CSRF cookie the server issued, to echo it on state-changing
// requests (double-submit-cookie pattern).
function csrfToken(): string {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

function csrfHeaders(): Record<string, string> {
  return { 'x-csrf-token': csrfToken() };
}

export async function fetchSession(): Promise<SessionInfo> {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    if (!res.ok) return { authenticated: false };
    return (await res.json()) as SessionInfo;
  } catch {
    return { authenticated: false }; // API unreachable → treat as signed out
  }
}

// Login with optional TOTP code. Throws AuthError (with .code) on failure — callers
// detect code === 'mfa_required' to reveal the MFA step. The password/code are only
// sent over the request body and never persisted or logged client-side.
export async function login(email: string, password: string, code?: string): Promise<SessionInfo> {
  const res = await safeFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    credentials: 'include',
    body: JSON.stringify(code ? { email, password, code } : { email, password }),
  });
  if (!res.ok) throw await toAuthError(res);
  return (await res.json()) as SessionInfo;
}

export async function logout(): Promise<void> {
  await safeFetch('/api/auth/logout', { method: 'POST', credentials: 'include', headers: { ...csrfHeaders() } }).catch(() => undefined);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await safeFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as T;
}

export interface MfaEnrollResponse { secret: string; otpauthUrl: string; qrDataUrl: string }
export function mfaEnroll(): Promise<MfaEnrollResponse> {
  return postJson<MfaEnrollResponse>('/api/auth/mfa/enroll', {});
}
export function mfaVerify(code: string): Promise<{ ok: boolean; mfaEnabled: boolean }> {
  return postJson('/api/auth/mfa/verify', { code });
}

// Password reset — always resolves generically (server never reveals account existence).
export async function requestPasswordReset(email: string): Promise<void> {
  await safeFetch('/api/auth/request-password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    credentials: 'include',
    body: JSON.stringify({ email }),
  }).catch(() => undefined);
}
export function resetPassword(token: string, newPassword: string): Promise<{ ok: boolean }> {
  return postJson('/api/auth/reset-password', { token, newPassword });
}
