import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Role } from '../../../shared/auth/roles';

// Persistent, file-backed user store for accounts provisioned via `npm run create-admin`.
// This is the integration seam between the in-memory dev seed users and a future real
// database / identity provider. The file holds scrypt password HASHES only — never
// plaintext — and is GIT-IGNORED so credentials never enter the repository.

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
}

// Location is configurable; defaults to a git-ignored folder under server/.
export function storePath(): string {
  return resolve(process.cwd(), process.env.ADMIN_STORE_PATH ?? 'server/.data/users.json');
}

export function loadPersistedUsers(): StoredUser[] {
  const path = storePath();
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
}

export function emailExists(email: string): boolean {
  const norm = email.trim().toLowerCase();
  return loadPersistedUsers().some(u => u.email.toLowerCase() === norm);
}

export function addPersistedUser(user: StoredUser): void {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  const users = loadPersistedUsers();
  users.push(user);
  // Restrictive permissions: owner read/write only (best-effort; ignored on some FS).
  writeFileSync(path, JSON.stringify(users, null, 2), { mode: 0o600 });
}
