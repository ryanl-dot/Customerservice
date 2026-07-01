import type { SessionInfo } from '../../shared/auth/session';
import type { ApiErrorBody } from '../../shared/api/types';

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
  const res = await fetch('/api/auth/session', { credentials: 'include' });
  if (!res.ok) return { authenticated: false };
  return (await res.json()) as SessionInfo;
}

export async function login(email: string, password: string): Promise<SessionInfo> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as SessionInfo;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', headers: { ...csrfHeaders() } });
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
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
  await fetch('/api/auth/request-password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
}
export function resetPassword(token: string, newPassword: string): Promise<{ ok: boolean }> {
  return postJson('/api/auth/reset-password', { token, newPassword });
}
