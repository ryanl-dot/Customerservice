/**
 * ONE-TIME, EXPLICIT migration of a single local JSON-store admin into PostgreSQL.
 *
 *   npm run migrate-local-admin -- you@example.com
 *
 * This is never run automatically. It COPIES one account (by email) from
 * server/.data/users.json into the database, preserving the existing scrypt hash
 * (your password is not reset and is never displayed).
 *
 * What is copied:      name, normalized email, role, existing password hash.
 * What is NOT copied:  dev seed users, any other JSON accounts, timestamps.
 * Duplicates:          if the email already exists in the DB, it aborts (no change).
 * Rollback:            delete the row —
 *                        npx prisma studio   (or)   DELETE FROM users WHERE email='...';
 * Confirm before deleting the local copy:
 *                      1) run this script, 2) start the server with USER_STORE=db,
 *                      3) log in with your email/password, 4) only then remove
 *                         server/.data/users.json.
 */
import { loadPersistedUsers } from '../server/src/lib/userStore';
import { userStore, isProduction } from '../server/src/lib/config';
import * as dbUsers from '../server/src/db/repositories/users';
import { disconnectPrisma } from '../server/src/db/client';

async function main() {
  const email = (process.argv[2] ?? '').trim().toLowerCase();
  if (!email) throw new Error('Usage: npm run migrate-local-admin -- <email>');
  if (userStore() !== 'db') throw new Error('Set USER_STORE=db and DATABASE_URL before migrating.');
  if (isProduction()) throw new Error('Do not run the local-admin migration in production.');

  const local = loadPersistedUsers().find(u => u.email.toLowerCase() === email);
  if (!local) throw new Error(`No local account with ${email} found in server/.data/users.json.`);

  if (await dbUsers.emailExists(email)) {
    throw new Error(`${email} already exists in the database — aborting (no change).`);
  }

  const created = await dbUsers.createUser({
    name: local.name,
    email: local.email,
    role: local.role,
    passwordHash: local.passwordHash, // preserved as-is; password is unchanged
  });

  console.log(`\n✓ Copied ${email} (role ${local.role}) into the database as id ${created.id}.`);
  console.log('  Password unchanged. Verify login with USER_STORE=db BEFORE deleting server/.data/users.json.');
  console.log('  Rollback: delete the row via prisma studio or SQL DELETE.\n');
}

main()
  .then(async () => { await disconnectPrisma().catch(() => {}); process.exit(0); })
  .catch(async (err: unknown) => {
    await disconnectPrisma().catch(() => {});
    console.error(`\n✗ ${err instanceof Error ? err.message : 'Migration failed.'}\n`);
    process.exit(1);
  });
