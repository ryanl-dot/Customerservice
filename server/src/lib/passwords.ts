import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

// Password hashing using Node's built-in scrypt KDF (a proven, memory-hard
// primitive). No homemade crypto, no plaintext storage. Format: "salt:derived".

const KEYLEN = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(plain, salt, KEYLEN).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, derivedHex] = stored.split(':');
  if (!salt || !derivedHex) return false;
  const derived = Buffer.from(derivedHex, 'hex');
  const candidate = scryptSync(plain, salt, KEYLEN);
  // Constant-time comparison to avoid timing leaks.
  return derived.length === candidate.length && timingSafeEqual(derived, candidate);
}
