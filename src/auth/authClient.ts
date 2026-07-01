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

export async function fetchSession(): Promise<SessionInfo> {
  const res = await fetch('/api/auth/session', { credentials: 'include' });
  if (!res.ok) return { authenticated: false };
  return (await res.json()) as SessionInfo;
}

export async function login(email: string, password: string): Promise<SessionInfo> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as SessionInfo;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}
