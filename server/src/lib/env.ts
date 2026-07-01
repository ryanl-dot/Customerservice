import {
  appMode, dataMode, userStore, seedUsersEnabled, isDevDefaultSecret,
} from './config';

// Fail-closed environment validation. In PRODUCTION the server must refuse to start
// on any unsafe configuration; in development/test it stays permissive. Returns a
// list of human-readable problems (empty = OK). Pure function of `env` so it is unit
// testable. NEVER prints secret VALUES — only which variable is wrong.

export function validateEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  const errors: string[] = [];
  const mode = appMode(env);

  if (mode !== 'production') return errors; // dev/test: permissive

  // ── Required production secrets ──────────────────────────────────────────────
  if (!env.DATABASE_URL) errors.push('DATABASE_URL is required in production.');
  if (!env.COOKIE_SECRET) errors.push('COOKIE_SECRET is required in production.');
  if (!env.SESSION_SECRET) errors.push('SESSION_SECRET is required in production.');
  if (!env.FRONTEND_ORIGIN) errors.push('FRONTEND_ORIGIN (allowed origin) is required in production.');

  // ── Reject known development placeholder secrets ─────────────────────────────
  if (isDevDefaultSecret(env.COOKIE_SECRET)) errors.push('COOKIE_SECRET is a known development default; set a unique secret.');
  if (isDevDefaultSecret(env.SESSION_SECRET)) errors.push('SESSION_SECRET is a known development default; set a unique secret.');

  // ── Reject unsafe modes/stores in production ─────────────────────────────────
  if (dataMode(env) !== 'production') errors.push('DATA_MODE must be "production" in production (mock/test are not allowed).');
  if (userStore(env) !== 'db') errors.push('USER_STORE must be "db" in production (the JSON user store is not allowed).');
  if (seedUsersEnabled(env)) errors.push('Development seed users must be disabled in production (set AUTH_DISABLE_SEED=1).');

  return errors;
}

// Call at startup. Exits the process (fail-closed) if production config is unsafe.
export function assertEnvOrExit(env: NodeJS.ProcessEnv = process.env): void {
  const errors = validateEnv(env);
  if (errors.length > 0) {
    console.error('[startup] Refusing to start — unsafe production configuration:');
    for (const e of errors) console.error(`  • ${e}`);
    console.error('[startup] Fix the environment and restart. No secret values are shown above.');
    process.exit(1);
  }
}
