import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { HAS_DB, resetDb } from './helpers/testDb';
import * as dbUsers from '../server/src/db/repositories/users';
import { disconnectPrisma } from '../server/src/db/client';
import { hashPassword, verifyPassword } from '../server/src/lib/passwords';

// Runs only when DATABASE_URL points at a test Postgres.
describe.skipIf(!HAS_DB)('DB-backed user store', () => {
  beforeEach(async () => { await resetDb(); });
  afterAll(async () => { await resetDb(); await disconnectPrisma(); });

  it('creates a user with a normalized email and administrator role', async () => {
    const u = await dbUsers.createUser({ name: 'Admin', email: '  Admin@Example.COM ', role: 'administrator', passwordHash: hashPassword('correct horse battery') });
    expect(u.email).toBe('admin@example.com');
    expect(u.role).toBe('administrator');
    expect(u.accountStatus).toBe('active');
  });

  it('rejects a duplicate email (normalized)', async () => {
    await dbUsers.createUser({ name: 'A', email: 'dup@example.com', role: 'administrator', passwordHash: hashPassword('pw-aaaaaaaaaaaa') });
    await expect(
      dbUsers.createUser({ name: 'B', email: 'DUP@example.com', role: 'administrator', passwordHash: hashPassword('pw-bbbbbbbbbbbb') }),
    ).rejects.toBeInstanceOf(dbUsers.DuplicateEmailError);
  });

  it('verifies a correct password and rejects a wrong one', async () => {
    const pw = 'a-strong-passphrase-123';
    const u = await dbUsers.createUser({ name: 'V', email: 'verify@example.com', role: 'administrator', passwordHash: hashPassword(pw) });
    const fetched = await dbUsers.findByEmail('verify@example.com');
    expect(fetched?.id).toBe(u.id);
    expect(verifyPassword(pw, fetched!.passwordHash)).toBe(true);
    expect(verifyPassword('wrong-password', fetched!.passwordHash)).toBe(false);
  });

  it('locks the account after repeated failures', async () => {
    const u = await dbUsers.createUser({ name: 'L', email: 'lock@example.com', role: 'administrator', passwordHash: hashPassword('pw-locktest-123') });
    for (let i = 0; i < 5; i++) await dbUsers.recordLoginFailure(u.id, 5, 60_000);
    const locked = await dbUsers.findById(u.id);
    expect(dbUsers.isLocked(locked!)).toBe(true);
  });

  it('login success resets failed count and lock', async () => {
    const u = await dbUsers.createUser({ name: 'R', email: 'reset@example.com', role: 'administrator', passwordHash: hashPassword('pw-resettest-1') });
    await dbUsers.recordLoginFailure(u.id, 5, 60_000);
    await dbUsers.recordLoginSuccess(u.id);
    const after = await dbUsers.findById(u.id);
    expect(after?.failedLoginCount).toBe(0);
    expect(after?.lockedUntil).toBeNull();
    expect(after?.lastLoginAt).not.toBeNull();
  });

  it('can disable an account', async () => {
    const u = await dbUsers.createUser({ name: 'D', email: 'disable@example.com', role: 'administrator', passwordHash: hashPassword('pw-disabletest') });
    await dbUsers.setAccountStatus(u.id, 'disabled');
    const after = await dbUsers.findById(u.id);
    expect(after?.accountStatus).toBe('disabled');
  });
});
