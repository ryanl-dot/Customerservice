import { hashPassword } from './passwords';
import { loadPersistedUsers, type StoredUser } from './userStore';

export type { StoredUser };

// ── User resolution ──────────────────────────────────────────────────────────────
// Two sources, checked in order:
//   1. PERSISTED users  — real accounts provisioned via `npm run create-admin`,
//      stored in a git-ignored file as scrypt hashes (server/src/lib/userStore.ts).
//   2. DEV SEED users   — one fixture per role for local role testing, hashed at
//      startup from SEED_PASSWORD. Disabled when AUTH_DISABLE_SEED=1.
// Persisted accounts take precedence on duplicate email. In production this whole
// module is replaced by a real identity provider / database.

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'dev-password-change-me';
const SEED_DISABLED = process.env.AUTH_DISABLE_SEED === '1';

if (!SEED_DISABLED && !process.env.SEED_PASSWORD) {
  console.warn('[auth] SEED_PASSWORD not set — dev seed users use an insecure default. Set SEED_PASSWORD, or AUTH_DISABLE_SEED=1 to disable seed users entirely.');
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

const seedUsers: StoredUser[] = SEED_DISABLED
  ? []
  : SEED.map(u => ({ ...u, passwordHash: hashPassword(SEED_PASSWORD) }));

// Persisted users are read fresh so a newly created admin works without restarting
// (the file is tiny). Persisted entries are listed first → they win on email/id.
function allUsers(): StoredUser[] {
  return [...loadPersistedUsers(), ...seedUsers];
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const norm = email.trim().toLowerCase();
  return allUsers().find(u => u.email.toLowerCase() === norm);
}

export function findUserById(id: string): StoredUser | undefined {
  return allUsers().find(u => u.id === id);
}

export function publicUser(u: StoredUser) {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}
