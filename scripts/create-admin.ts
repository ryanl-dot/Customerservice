/**
 * Secure first-administrator provisioning.
 *
 *   npm run create-admin
 *
 * Prompts (interactively) for name, email, password, and confirmation; hashes the
 * password with scrypt on the server side; and writes the account to the configured
 * store — the PostgreSQL database when USER_STORE=db, otherwise the git-ignored JSON
 * file (development only). The password and its hash are NEVER printed. No default
 * credentials are invented — you choose your own password privately.
 *
 * Production safety: the JSON store is refused in production; only the database is
 * allowed. Seed/dev accounts are never written to the database.
 */
import * as readline from 'node:readline/promises';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../server/src/lib/passwords';
import { addPersistedUser, emailExists as jsonEmailExists, storePath } from '../server/src/lib/userStore';
import { userStore, isProduction } from '../server/src/lib/config';
import * as dbUsers from '../server/src/db/repositories/users';
import { disconnectPrisma } from '../server/src/db/client';

const MIN_PASSWORD = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isTTY = Boolean(process.stdin.isTTY);
const STORE = userStore(); // 'db' | 'json'

let rl: readline.Interface | null = null;
let pipedLines: string[] = [];

async function init() {
  if (isTTY) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  } else {
    // Non-interactive (piped) input: read it all up front and serve line by line.
    const chunks: Buffer[] = [];
    for await (const c of process.stdin) chunks.push(c as Buffer);
    pipedLines = Buffer.concat(chunks).toString('utf8').split(/\r?\n/);
  }
}

async function ask(query: string): Promise<string> {
  if (isTTY) return (await rl!.question(query)).trim();
  process.stdout.write(query);
  return (pipedLines.shift() ?? '').trim();
}

// Prompt for a secret. On a TTY, keystrokes are NOT echoed. When piped, the value is
// consumed without ever being written to stdout, so it is never displayed either way.
async function askHidden(query: string): Promise<string> {
  if (!isTTY) { process.stdout.write(query + '\n'); return pipedLines.shift() ?? ''; }
  const rlAny = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
  const original = rlAny._writeToOutput.bind(rl);
  let muted = false;
  rlAny._writeToOutput = (str: string) => {
    if (!muted) { original(str); return; }
    if (str.includes('\n') || str.includes('\r')) rlAny.output.write('\n');
    // else: swallow the echoed character
  };
  const pending = rl!.question(query);
  muted = true; // query already printed; subsequent keystrokes are hidden
  try { return await pending; } finally { rlAny._writeToOutput = original; }
}

async function main() {
  // Fail closed: never allow the JSON store in production.
  if (isProduction() && STORE === 'json') {
    throw new Error('Refusing to create a JSON-store admin in production. Set USER_STORE=db and DATABASE_URL.');
  }

  await init();
  console.log(`\nSolarCS — create administrator account (store: ${STORE})\n`);

  const name = await ask('Administrator name: ');
  if (!name) throw new Error('Name is required.');

  const email = (await ask('Administrator email: ')).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new Error('Please enter a valid email address.');

  if (STORE === 'db') {
    if (await dbUsers.emailExists(email)) throw new Error(`An account with ${email} already exists. Choose a different email.`);
  } else {
    if (jsonEmailExists(email)) throw new Error(`An account with ${email} already exists. Choose a different email.`);
  }

  const password = await askHidden('Password (min 12 chars, input hidden): ');
  if (password.length < MIN_PASSWORD) throw new Error(`Password must be at least ${MIN_PASSWORD} characters.`);

  const confirm = await askHidden('Confirm password: ');
  if (password !== confirm) throw new Error('Passwords do not match.');

  const passwordHash = hashPassword(password); // scrypt; plaintext is never stored or logged

  if (STORE === 'db') {
    const created = await dbUsers.createUser({ name, email, role: 'administrator', passwordHash });
    console.log(`\n✓ Administrator "${name}" <${email}> created in the database (id ${created.id}).`);
  } else {
    addPersistedUser({ id: `admin-${randomUUID()}`, name, email, role: 'administrator', passwordHash });
    console.log(`\n✓ Administrator "${name}" <${email}> created.`);
    console.log(`  Stored in: ${storePath()}`);
  }
  console.log('  (password hash written; plaintext was never displayed or saved)\n');
}

main()
  .then(async () => { rl?.close(); await disconnectPrisma().catch(() => {}); process.exit(0); })
  .catch(async (err: unknown) => {
    rl?.close();
    await disconnectPrisma().catch(() => {});
    console.error(`\n✗ ${err instanceof Error ? err.message : 'Failed to create administrator.'}\n`);
    process.exit(1);
  });
