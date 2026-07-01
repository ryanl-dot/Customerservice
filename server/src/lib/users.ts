import { hashPassword } from './passwords';
import { loadPersistedUsers, type StoredUser } from './userStore';
import { userStore, seedUsersEnabled, isProduction } from './config';
import type { Role } from '../../../shared/auth/roles';
import * as dbUsers from '../db/repositories/users';
import type { AccountStatus } from '../db/repositories/users';

export type { StoredUser };

// ── Unified auth record ──────────────────────────────────────────────────────────
// Shape the auth layer needs, regardless of backing store (DB or JSON). Password
// hash is included for server-side verification only; publicUser() strips it before
// anything reaches the frontend.
export interface AuthUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  accountStatus: AccountStatus;
  lockedUntil: Date | null;
  passwordChangedAt: Date;
  mfaEnabled: boolean;
}

function fromDb(u: dbUsers.DbUser): AuthUserRecord {
  return {
    id: u.id, name: u.name, email: u.email, passwordHash: u.passwordHash, role: u.role,
    accountStatus: u.accountStatus, lockedUntil: u.lockedUntil,
    passwordChangedAt: u.passwordChangedAt, mfaEnabled: u.mfaEnabled,
  };
}

// ── JSON / seed store (development only) ───────────────────────────────────────────
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'dev-password-change-me';
const SEED_DISABLED = !seedUsersEnabled();

if (userStore() === 'json' && !SEED_DISABLED && !process.env.SEED_PASSWORD) {
  console.warn('[auth] SEED_PASSWORD not set — dev seed users use an insecure default. Set SEED_PASSWORD, or AUTH_DISABLE_SEED=1.');
}

const SEED: Array<Omit<StoredUser, 'passwordHash'>> = [
  { id: 'u-cs',    name: 'Sarah Mitchell', email: 'cs@solarcs.test',        role: 'customer_service' },
  { id: 'u-ops',   name: 'Omar Reyes',     email: 'ops@solarcs.test',       role: 'operations' },
  { id: 'u-comp',  name: 'Dana Cole',      email: 'compliance@solarcs.test',role: 'compliance' },
  { id: 'u-mgmt',  name: 'Priya Patel',    email: 'manager@solarcs.test',   role: 'management' },
  { id: 'u-exec',  name: 'Evelyn Stone',   email: 'exec@solarcs.test',      role: 'executive' },
  { id: 'u-admin', name: 'Alex Admin',     email: 'admin@solarcs.test',     role: 'administrator' },
  { id: 'u-dev',   name: 'Dev Tester',     email: 'dev@solarcs.test',       role: 'developer' },
];

const seedUsers: StoredUser[] = SEED_DISABLED ? [] : SEED.map(u => ({ ...u, passwordHash: hashPassword(SEED_PASSWORD) }));

function jsonAll(): AuthUserRecord[] {
  const stored = [...loadPersistedUsers(), ...seedUsers];
  return stored.map(u => ({
    id: u.id, name: u.name, email: u.email, passwordHash: u.passwordHash, role: u.role,
    accountStatus: 'active' as AccountStatus, lockedUntil: null,
    passwordChangedAt: new Date(0), mfaEnabled: false,
  }));
}

// ── Store selection ────────────────────────────────────────────────────────────────
// Production is guaranteed to be 'db' by startup env validation; this is a defensive
// second check so DB-only code paths never silently read the JSON store in production.
function shouldUseDb(): boolean {
  if (isProduction()) return true;
  return userStore() === 'db';
}

export async function getUserByEmail(email: string): Promise<AuthUserRecord | null> {
  if (shouldUseDb()) {
    const u = await dbUsers.findByEmail(email);
    return u ? fromDb(u) : null;
  }
  const norm = email.trim().toLowerCase();
  return jsonAll().find(u => u.email.toLowerCase() === norm) ?? null;
}

export async function getUserById(id: string): Promise<AuthUserRecord | null> {
  if (shouldUseDb()) {
    const u = await dbUsers.findById(id);
    return u ? fromDb(u) : null;
  }
  return jsonAll().find(u => u.id === id) ?? null;
}

export async function recordLoginSuccess(id: string): Promise<void> {
  if (shouldUseDb()) await dbUsers.recordLoginSuccess(id);
}

export async function recordLoginFailure(id: string): Promise<void> {
  if (shouldUseDb()) await dbUsers.recordLoginFailure(id);
}

export function publicUser(u: Pick<AuthUserRecord, 'id' | 'name' | 'email' | 'role'>) {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}
