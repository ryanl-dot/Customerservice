import { describe, it, expect, beforeAll } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';

// Configure a same-origin serving app (SPA fallback enabled).
process.env.APP_MODE = 'development';
process.env.USER_STORE = 'json';
process.env.AUTH_DISABLE_SEED = '1';
process.env.FRONTEND_ORIGIN = 'https://app.example.com';
process.env.COOKIE_SECRET = 'test-cookie-secret-value-1234567890';
process.env.SERVE_SPA = '1';

const MARKER = '<!doctype html><title>SolarCS SPA</title>';
let app: import('express').Express;

beforeAll(async () => {
  // Ensure a dist/index.html exists for the SPA fallback (dist is git-ignored).
  const dist = path.resolve(process.cwd(), 'dist');
  mkdirSync(dist, { recursive: true });
  writeFileSync(path.join(dist, 'index.html'), MARKER);
  app = (await import('../server/src/app')).createApp();
});

describe('Same-origin SPA serving', () => {
  it('serves index.html for a client route (SPA fallback)', async () => {
    const res = await request(app).get('/some/client/route');
    expect(res.status).toBe(200);
    expect(res.text).toContain('SolarCS SPA');
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('never returns SPA HTML for an unknown API route (always JSON error)', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect([401, 404]).toContain(res.status); // auth guard (401) or not_found (404)
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.error.code).toBeTruthy();
    expect(res.text).not.toContain('SolarCS SPA'); // never the SPA HTML
  });

  it('health endpoint stays JSON and accessible', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('Readiness / database-unavailable handling', () => {
  it('reports ready with db=n/a in JSON store mode', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
  });

  it('returns 503 when the DB store is active but unreachable', async () => {
    const prevStore = process.env.USER_STORE;
    const prevUrl = process.env.DATABASE_URL;
    process.env.USER_STORE = 'db';
    delete process.env.DATABASE_URL; // getPrisma() will throw → readiness 503
    try {
      const res = await request(app).get('/api/health/ready');
      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('upstream_unavailable');
    } finally {
      process.env.USER_STORE = prevStore;
      if (prevUrl) process.env.DATABASE_URL = prevUrl;
    }
  });
});
