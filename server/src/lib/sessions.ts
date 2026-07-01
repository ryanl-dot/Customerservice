import { randomBytes, createHash } from 'node:crypto';
import { userStore, isProduction } from './config';
import * as dbSessions from '../db/repositories/sessions';

// Session facade. Uses the DATABASE when USER_STORE=db (always in production) →
// persistent across restarts, revocable, server-enforced expiry. In JSON dev mode it
// uses an in-memory map (restart-dependent, dev only). Either way the cookie carries
// only an opaque high-entropy id; no session secret or user data is in the cookie.

const TTL_MS = Number(process.env.SESSION_TTL_MS ?? 1000 * 60 * 60 * 8); // 8h default

export interface SessionView {
  token: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

export type SessionLookup =
  | { status: 'ok'; session: SessionView }
  | { status: 'expired' }
  | { status: 'revoked' }
  | { status: 'missing' };

function shouldUseDb(): boolean {
  return isProduction() || userStore() === 'db';
}

function newToken(): string {
  return randomBytes(32).toString('hex');
}

// Hash UA/IP with the cookie secret so stored values are non-reversible (data
// minimization). Returns null when the input is absent.
export function hashMeta(value: string | undefined): string | null {
  if (!value) return null;
  const salt = process.env.SESSION_SECRET ?? process.env.COOKIE_SECRET ?? 'dev-salt';
  return createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 32);
}

// ── In-memory dev store ────────────────────────────────────────────────────────────
interface MemSession { userId: string; createdAt: Date; expiresAt: Date; revokedAt: Date | null }
const mem = new Map<string, MemSession>();

// ── Public API (async) ───────────────────────────────────────────────────────────
export async function createSession(userId: string, meta?: { userAgent?: string; ip?: string }): Promise<SessionView> {
  const token = newToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);
  if (shouldUseDb()) {
    await dbSessions.createSession({
      id: token, userId, expiresAt,
      userAgentHash: hashMeta(meta?.userAgent), ipHash: hashMeta(meta?.ip),
    });
  } else {
    mem.set(token, { userId, createdAt: now, expiresAt, revokedAt: null });
  }
  return { token, userId, createdAt: now, expiresAt };
}

export async function getSession(token: string | undefined): Promise<SessionLookup> {
  if (!token) return { status: 'missing' };
  if (shouldUseDb()) {
    const s = await dbSessions.findById(token);
    if (!s) return { status: 'missing' };
    if (s.revokedAt) return { status: 'revoked' };
    if (s.expiresAt.getTime() <= Date.now()) return { status: 'expired' };
    return { status: 'ok', session: { token: s.id, userId: s.userId, createdAt: s.createdAt, expiresAt: s.expiresAt } };
  }
  const s = mem.get(token);
  if (!s) return { status: 'missing' };
  if (s.revokedAt) return { status: 'revoked' };
  if (s.expiresAt.getTime() <= Date.now()) { mem.delete(token); return { status: 'expired' }; }
  return { status: 'ok', session: { token, userId: s.userId, createdAt: s.createdAt, expiresAt: s.expiresAt } };
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  if (shouldUseDb()) await dbSessions.revoke(token);
  else { const s = mem.get(token); if (s) s.revokedAt = new Date(); }
}

// Revoke every active session for a user — used on password change and disable.
export async function revokeAllForUser(userId: string): Promise<void> {
  if (shouldUseDb()) { await dbSessions.revokeAllForUser(userId); return; }
  for (const [, s] of mem) if (s.userId === userId && !s.revokedAt) s.revokedAt = new Date();
}

export async function touchSession(token: string): Promise<void> {
  // lastSeenAt is only tracked in the DB store; the in-memory dev store skips it.
  if (shouldUseDb()) await dbSessions.touch(token);
}

export function sessionExpiryIso(session: SessionView): string {
  return session.expiresAt.toISOString();
}
