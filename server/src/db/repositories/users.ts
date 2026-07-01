import type { Role } from '../../../../shared/auth/roles';
import { getPrisma } from '../client';

// Database-backed user repository. All email lookups/writes normalize the email.
// Password hashes are stored here but only ever returned to the server auth layer,
// never to the frontend (routes strip them via publicUser).

export type AccountStatus = 'active' | 'disabled';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  accountStatus: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  failedLoginCount: number;
  lockedUntil: Date | null;
  passwordChangedAt: Date;
  mfaEnabled: boolean;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class DuplicateEmailError extends Error {
  constructor(email: string) { super(`An account with ${email} already exists.`); }
}

export async function createUser(input: {
  name: string; email: string; passwordHash: string; role: Role;
}): Promise<DbUser> {
  const email = normalizeEmail(input.email);
  try {
    const u = await getPrisma().user.create({
      data: { name: input.name, email, passwordHash: input.passwordHash, role: input.role },
    });
    return u as DbUser;
  } catch (err: unknown) {
    // Prisma unique-constraint violation → domain error (P2002).
    if (typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002') {
      throw new DuplicateEmailError(email);
    }
    throw err;
  }
}

export async function findByEmail(email: string): Promise<DbUser | null> {
  return (await getPrisma().user.findUnique({ where: { email: normalizeEmail(email) } })) as DbUser | null;
}

export async function findById(id: string): Promise<DbUser | null> {
  return (await getPrisma().user.findUnique({ where: { id } })) as DbUser | null;
}

export async function emailExists(email: string): Promise<boolean> {
  return (await findByEmail(email)) !== null;
}

export async function recordLoginSuccess(id: string): Promise<void> {
  await getPrisma().user.update({
    where: { id },
    data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null },
  });
}

// Increment failed-login counter and lock the account for a window after a threshold.
export async function recordLoginFailure(id: string, maxAttempts = 5, lockMs = 15 * 60 * 1000): Promise<void> {
  const user = await findById(id);
  if (!user) return;
  const next = user.failedLoginCount + 1;
  await getPrisma().user.update({
    where: { id },
    data: { failedLoginCount: next, lockedUntil: next >= maxAttempts ? new Date(Date.now() + lockMs) : user.lockedUntil },
  });
}

export async function setAccountStatus(id: string, status: AccountStatus): Promise<void> {
  await getPrisma().user.update({ where: { id }, data: { accountStatus: status } });
}

export async function changePassword(id: string, passwordHash: string): Promise<void> {
  await getPrisma().user.update({ where: { id }, data: { passwordHash, passwordChangedAt: new Date() } });
}

export function isLocked(user: Pick<DbUser, 'lockedUntil'>): boolean {
  return user.lockedUntil !== null && user.lockedUntil.getTime() > Date.now();
}
