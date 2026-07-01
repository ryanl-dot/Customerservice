// Centralized runtime configuration. Three explicit modes drive every safety
// decision. APP_MODE is the authority; NODE_ENV is respected for tooling only.

export type AppMode = 'development' | 'test' | 'production';
export type UserStoreKind = 'json' | 'db';
export type DataMode = 'mock' | 'test' | 'production';

export function appMode(env: NodeJS.ProcessEnv = process.env): AppMode {
  const raw = (env.APP_MODE ?? 'development').toLowerCase();
  return raw === 'production' ? 'production' : raw === 'test' ? 'test' : 'development';
}

export function isProduction(env: NodeJS.ProcessEnv = process.env): boolean {
  return appMode(env) === 'production';
}

export function dataMode(env: NodeJS.ProcessEnv = process.env): DataMode {
  const raw = (env.DATA_MODE ?? (isProduction(env) ? 'production' : 'mock')).toLowerCase();
  return raw === 'production' ? 'production' : raw === 'test' ? 'test' : 'mock';
}

export function userStore(env: NodeJS.ProcessEnv = process.env): UserStoreKind {
  // Default to the DB in production, JSON only for local/dev convenience.
  const raw = (env.USER_STORE ?? (isProduction(env) ? 'db' : 'json')).toLowerCase();
  return raw === 'db' ? 'db' : 'json';
}

// Seed (dev fixture) users are enabled unless explicitly disabled. Production must
// disable them (AUTH_DISABLE_SEED=1) — enforced by env validation.
export function seedUsersEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.AUTH_DISABLE_SEED !== '1';
}

// Known development placeholder secrets that must never be used in production.
export const DEV_DEFAULT_SECRETS: readonly string[] = [
  'dev-cookie-secret-change-me',
  'dev-session-secret-change-me',
  'dev-password-change-me',
  'change-me',
  'changeme',
  'secret',
];

export function isDevDefaultSecret(value: string | undefined): boolean {
  return value !== undefined && DEV_DEFAULT_SECRETS.includes(value);
}
