import { randomBytes } from 'node:crypto';

// In-memory session store. Integration-ready seam: replace with Redis or the
// identity provider's session/JWT in production. Tokens are opaque random values
// delivered ONLY via a signed, httpOnly cookie (set in app.ts) — never in JS-readable
// storage, so they are not exposed to XSS the way localStorage tokens are.

export interface Session {
  token: string;
  userId: string;
  expiresAt: number; // epoch ms
}

const TTL_MS = Number(process.env.SESSION_TTL_MS ?? 1000 * 60 * 60 * 8); // 8h default
const store = new Map<string, Session>();

export function createSession(userId: string): Session {
  const token = randomBytes(32).toString('hex');
  const session: Session = { token, userId, expiresAt: Date.now() + TTL_MS };
  store.set(token, session);
  return session;
}

export type SessionLookup =
  | { status: 'ok'; session: Session }
  | { status: 'expired' }
  | { status: 'missing' };

export function getSession(token: string | undefined): SessionLookup {
  if (!token) return { status: 'missing' };
  const session = store.get(token);
  if (!session) return { status: 'missing' };
  if (session.expiresAt <= Date.now()) {
    store.delete(token);
    return { status: 'expired' };
  }
  return { status: 'ok', session };
}

export function destroySession(token: string | undefined): void {
  if (token) store.delete(token);
}

export function sessionExpiryIso(session: Session): string {
  return new Date(session.expiresAt).toISOString();
}
