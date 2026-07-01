import { describe, it, expect } from 'vitest';
import { validateEnv } from '../server/src/lib/env';

// A complete, safe production environment used as the baseline for each test.
const okProd: NodeJS.ProcessEnv = {
  APP_MODE: 'production',
  DATA_MODE: 'production',
  USER_STORE: 'db',
  AUTH_DISABLE_SEED: '1',
  DATABASE_URL: 'postgresql://u:p@host:5432/db',
  COOKIE_SECRET: 'a-real-long-random-cookie-secret-value',
  SESSION_SECRET: 'a-real-long-random-session-secret-value',
  FRONTEND_ORIGIN: 'https://app.example.com',
};

describe('Production startup env validation (fail-closed)', () => {
  it('accepts a fully-configured production environment', () => {
    expect(validateEnv(okProd)).toEqual([]);
  });

  it('development mode is permissive (no errors even when empty)', () => {
    expect(validateEnv({ APP_MODE: 'development' })).toEqual([]);
    expect(validateEnv({})).toEqual([]);
  });

  it('rejects missing DATABASE_URL in production', () => {
    const errs = validateEnv({ ...okProd, DATABASE_URL: undefined });
    expect(errs.some(e => e.includes('DATABASE_URL'))).toBe(true);
  });

  it('rejects missing COOKIE_SECRET and SESSION_SECRET in production', () => {
    const errs = validateEnv({ ...okProd, COOKIE_SECRET: undefined, SESSION_SECRET: undefined });
    expect(errs.some(e => e.includes('COOKIE_SECRET'))).toBe(true);
    expect(errs.some(e => e.includes('SESSION_SECRET'))).toBe(true);
  });

  it('rejects missing FRONTEND_ORIGIN in production', () => {
    expect(validateEnv({ ...okProd, FRONTEND_ORIGIN: undefined }).some(e => e.includes('FRONTEND_ORIGIN'))).toBe(true);
  });

  it('rejects known development default secrets in production', () => {
    const errs = validateEnv({ ...okProd, COOKIE_SECRET: 'dev-cookie-secret-change-me', SESSION_SECRET: 'change-me' });
    expect(errs.some(e => e.includes('COOKIE_SECRET'))).toBe(true);
    expect(errs.some(e => e.includes('SESSION_SECRET'))).toBe(true);
  });

  it('rejects DATA_MODE=mock in production', () => {
    expect(validateEnv({ ...okProd, DATA_MODE: 'mock' }).some(e => e.includes('DATA_MODE'))).toBe(true);
  });

  it('rejects USER_STORE=json in production', () => {
    expect(validateEnv({ ...okProd, USER_STORE: 'json' }).some(e => e.includes('USER_STORE'))).toBe(true);
  });

  it('rejects enabled seed users in production', () => {
    expect(validateEnv({ ...okProd, AUTH_DISABLE_SEED: undefined }).some(e => e.includes('seed'))).toBe(true);
  });

  it('never includes a secret value in an error message', () => {
    const errs = validateEnv({ ...okProd, COOKIE_SECRET: 'dev-cookie-secret-change-me' });
    expect(errs.join(' ')).not.toContain('dev-cookie-secret-change-me');
  });
});
