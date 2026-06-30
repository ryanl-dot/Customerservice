/**
 * Secure first-administrator provisioning.
 *
 *   npm run create-admin
 *
 * Prompts (interactively) for name, email, password, and confirmation; hashes the
 * password with scrypt on the server side; and writes the account to the git-ignored
 * persistent store. The password and its hash are NEVER printed. No default
 * credentials are invented — you choose your own password privately.
 */
import * as readline from 'node:readline/promises';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../server/src/lib/passwords';
import { addPersistedUser, emailExists, storePath } from '../server/src/lib/userStore';
import { findUserByEmail } from '../server/src/lib/users';

const MIN_PASSWORD = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isTTY = Boolean(process.stdin.isTTY);

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
  await init();
  console.log('\nSolarCS — create administrator account\n');

  const name = await ask('Administrator name: ');
  if (!name) throw new Error('Name is required.');

  const email = (await ask('Administrator email: ')).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new Error('Please enter a valid email address.');

  // Duplicate prevention — across persisted accounts AND seed/dev users.
  if (emailExists(email) || findUserByEmail(email)) {
    throw new Error(`An account with ${email} already exists. Choose a different email.`);
  }

  const password = await askHidden('Password (min 12 chars, input hidden): ');
  if (password.length < MIN_PASSWORD) throw new Error(`Password must be at least ${MIN_PASSWORD} characters.`);

  const confirm = await askHidden('Confirm password: ');
  if (password !== confirm) throw new Error('Passwords do not match.');

  addPersistedUser({
    id: `admin-${randomUUID()}`,
    name,
    email,
    role: 'administrator',
    passwordHash: hashPassword(password), // scrypt; plaintext is never stored or logged
  });

  console.log(`\n✓ Administrator "${name}" <${email}> created.`);
  console.log(`  Stored in: ${storePath()}`);
  console.log('  (password hash written; plaintext was never displayed or saved)\n');
}

main()
  .then(() => { rl?.close(); process.exit(0); })
  .catch((err: unknown) => {
    rl?.close();
    console.error(`\n✗ ${err instanceof Error ? err.message : 'Failed to create administrator.'}\n`);
    process.exit(1);
  });
