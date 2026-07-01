import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { HAS_DB, resetDb } from './helpers/testDb';
import * as dbUsers from '../server/src/db/repositories/users';
import { createResetToken, consumeResetToken } from '../server/src/db/repositories/passwordReset';
import { getPrisma, disconnectPrisma } from '../server/src/db/client';
import { hashPassword, verifyPassword } from '../server/src/lib/passwords';

process.env.USER_STORE = 'db';

async function makeUser(email: string) {
  return dbUsers.createUser({ name: 'R', email, role: 'administrator', passwordHash: hashPassword('original-pw-123') });
}

describe.skipIf(!HAS_DB)('Password reset tokens', () => {
  beforeEach(async () => { await getPrisma().passwordResetToken.deleteMany({}); await resetDb(); });
  afterAll(async () => { await resetDb(); await disconnectPrisma(); });

  it('stores only a hash — never the raw token', async () => {
    const u = await makeUser('r1@example.com');
    const { rawToken } = await createResetToken(u.id);
    const rows = await getPrisma().passwordResetToken.findMany({ where: { userId: u.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).not.toBe(rawToken);
    expect(rows[0].tokenHash.length).toBe(64); // sha256 hex
  });

  it('consumes a valid token exactly once (single-use)', async () => {
    const u = await makeUser('r2@example.com');
    const { rawToken } = await createResetToken(u.id);
    const first = await consumeResetToken(rawToken);
    expect(first?.userId).toBe(u.id);
    const second = await consumeResetToken(rawToken);
    expect(second).toBeNull(); // already used
  });

  it('rejects an expired token', async () => {
    const u = await makeUser('r3@example.com');
    const { rawToken } = await createResetToken(u.id);
    // Force expiry in the past.
    await getPrisma().passwordResetToken.updateMany({ where: { userId: u.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await consumeResetToken(rawToken)).toBeNull();
  });

  it('creating a new token invalidates prior unused tokens', async () => {
    const u = await makeUser('r4@example.com');
    const { rawToken: old } = await createResetToken(u.id);
    await createResetToken(u.id);
    expect(await consumeResetToken(old)).toBeNull(); // old token no longer valid
  });

  it('rejects an unknown token', async () => {
    expect(await consumeResetToken('deadbeef'.repeat(8))).toBeNull();
  });

  it('after reset, the new password verifies (flow-level)', async () => {
    const u = await makeUser('r5@example.com');
    const { rawToken } = await createResetToken(u.id);
    const lookup = await consumeResetToken(rawToken);
    await dbUsers.changePassword(lookup!.userId, hashPassword('brand-new-pw-456'));
    const after = await dbUsers.findById(u.id);
    expect(verifyPassword('brand-new-pw-456', after!.passwordHash)).toBe(true);
    expect(after!.passwordChangedAt.getTime()).toBeGreaterThan(0);
  });
});
