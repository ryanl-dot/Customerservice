import { randomBytes, createHash } from 'node:crypto';
import { getPrisma } from '../client';

// Single-use, hashed, expiring password-reset tokens. The RAW token is returned only
// to the server-side caller (to be emailed) and is NEVER stored or logged; only its
// SHA-256 hash is persisted.

const TTL_MS = 1000 * 60 * 60; // 1 hour

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function createResetToken(userId: string): Promise<{ rawToken: string; expiresAt: Date }> {
  // Invalidate any prior unused tokens for this user.
  await getPrisma().passwordResetToken.updateMany({
    where: { userId, usedAt: null }, data: { usedAt: new Date() },
  });
  const rawToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TTL_MS);
  await getPrisma().passwordResetToken.create({ data: { userId, tokenHash: hashToken(rawToken), expiresAt } });
  return { rawToken, expiresAt };
}

export interface ResetLookup { userId: string; tokenId: string }

// Returns the target user id if the token is valid (exists, unused, unexpired).
export async function consumeResetToken(rawToken: string): Promise<ResetLookup | null> {
  const row = await getPrisma().passwordResetToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;
  // Mark used atomically (only if still unused) to enforce single use.
  const marked = await getPrisma().passwordResetToken.updateMany({
    where: { id: row.id, usedAt: null }, data: { usedAt: new Date() },
  });
  if (marked.count !== 1) return null; // lost a race → already used
  return { userId: row.userId, tokenId: row.id };
}
