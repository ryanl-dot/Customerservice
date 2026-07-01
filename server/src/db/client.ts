import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Lazy Prisma singleton using the node-postgres driver adapter (Rust-free client —
// no query-engine binary needed). Constructed on first use so importing this module
// in JSON-store dev mode (no DATABASE_URL) never crashes. DATABASE_URL is read from
// the environment only; it is never hardcoded or logged.

let client: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (client) return client;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — the database client is unavailable in this mode.');
  }
  const adapter = new PrismaPg({ connectionString });
  client = new PrismaClient({ adapter });
  return client;
}

export async function disconnectPrisma(): Promise<void> {
  if (client) { await client.$disconnect(); client = null; }
}
