import type { Role } from '../../../shared/auth/roles';
import { hashPassword } from './passwords';

// ── Development user store ───────────────────────────────────────────────────────
// Integration-ready seam: in production this is replaced by a real identity provider
// (Auth0 / Clerk / Cognito / Entra ID) or a database-backed user table. Here we seed
// one user per role for local testing. Passwords are NEVER stored in plaintext — they
// are hashed at startup from SEED_PASSWORD (env). No real customer accounts live here.

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
}

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'dev-password-change-me';

if (!process.env.SEED_PASSWORD) {
  // Visible warning, no secret printed.
  console.warn('[auth] SEED_PASSWORD not set — using insecure default dev password. Set SEED_PASSWORD before any shared/staging deployment.');
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

const users: StoredUser[] = SEED.map(u => ({ ...u, passwordHash: hashPassword(SEED_PASSWORD) }));

export function findUserByEmail(email: string): StoredUser | undefined {
  const norm = email.trim().toLowerCase();
  return users.find(u => u.email.toLowerCase() === norm);
}

export function findUserById(id: string): StoredUser | undefined {
  return users.find(u => u.id === id);
}

export function publicUser(u: StoredUser) {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}
