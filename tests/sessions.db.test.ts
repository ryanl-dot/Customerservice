import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { HAS_DB, resetDb } from './helpers/testDb';
import * as dbUsers from '../server/src/db/repositories/users';
import * as dbSessions from '../server/src/db/repositories/sessions';
import { createSession, getSession, destroySession, revokeAllForUser } from '../server/src/lib/sessions';
import { disconnectPrisma } from '../server/src/db/client';
import { hashPassword } from '../server/src/lib/passwords';

// Force the DB-backed session path.
process.env.USER_STORE = 'db';

async function makeUser(email: string) {
  return dbUsers.createUser({ name: 'S', email, role: 'administrator', passwordHash: hashPassword('pw-abcdefghij') });
}

describe.skipIf(!HAS_DB)('DB-backed sessions (persistent + revocable)', () => {
  beforeEach(async () => { await resetDb(); });
  afterAll(async () => { await resetDb(); await disconnectPrisma(); });

  it('creates a session that persists and validates', async () => {
    const u = await makeUser('sess1@example.com');
    const s = await createSession(u.id);
    const lookup = await getSession(s.token);
    expect(lookup.status).toBe('ok');
    // Persisted row exists independently (survives a process restart).
    expect(await dbSessions.findById(s.token)).not.toBeNull();
  });

  it('logout revokes the session server-side', async () => {
    const u = await makeUser('sess2@example.com');
    const s = await createSession(u.id);
    await destroySession(s.token);
    expect((await getSession(s.token)).status).toBe('revoked');
  });

  it('rejects an expired session (server-enforced)', async () => {
    const u = await makeUser('sess3@example.com');
    await dbSessions.createSession({ id: 'expired-token-1', userId: u.id, expiresAt: new Date(Date.now() - 1000) });
    expect((await getSession('expired-token-1')).status).toBe('expired');
  });

  it('revokeAllForUser invalidates every active session (password change / disable)', async () => {
    const u = await makeUser('sess4@example.com');
    const a = await createSession(u.id);
    const b = await createSession(u.id);
    await revokeAllForUser(u.id);
    expect((await getSession(a.token)).status).toBe('revoked');
    expect((await getSession(b.token)).status).toBe('revoked');
  });

  it('unknown token is missing, not an error', async () => {
    expect((await getSession('does-not-exist')).status).toBe('missing');
    expect((await getSession(undefined)).status).toBe('missing');
  });
});
