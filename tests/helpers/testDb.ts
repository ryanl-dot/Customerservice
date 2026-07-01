import { getPrisma } from '../../server/src/db/client';

// DB integration tests only run when DATABASE_URL is set (e.g. against a local test
// Postgres). Without it they are skipped so `npm test` stays green with no DB.
export const HAS_DB = Boolean(process.env.DATABASE_URL);

export async function resetDb(): Promise<void> {
  const p = getPrisma();
  await p.session.deleteMany({});
  await p.user.deleteMany({});
}
