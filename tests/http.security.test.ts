import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// Force a permissive-but-configured environment for the app under test.
process.env.APP_MODE = 'development';
process.env.USER_STORE = 'json';
process.env.AUTH_DISABLE_SEED = '1';
process.env.FRONTEND_ORIGIN = 'https://app.example.com';
process.env.COOKIE_SECRET = 'test-cookie-secret-value-1234567890';

// Import after env is set so config reads the right values.
let app: import('express').Express;
beforeAll(async () => {
  const mod = await import('../server/src/app');
  app = mod.createApp();
});

function csrfFrom(setCookie: string[] | undefined): string {
  const raw = (setCookie ?? []).find(c => c.startsWith('csrf_token='));
  return raw ? decodeURIComponent(raw.split(';')[0].split('=')[1]) : '';
}

describe('Security headers', () => {
  it('sets CSP, frame, nosniff, referrer, permissions headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['permissions-policy']).toContain('camera=()');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('issues a csrf_token cookie and a request id', async () => {
    const res = await request(app).get('/api/health');
    expect(csrfFrom(res.headers['set-cookie'] as unknown as string[])).not.toBe('');
    expect(res.headers['x-request-id']).toBeDefined();
  });
});

describe('CSRF protection (double submit)', () => {
  it('rejects a state-changing POST with no CSRF token', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
  });

  it('rejects when header does not match cookie', async () => {
    const seed = await request(app).get('/api/health');
    const cookie = (seed.headers['set-cookie'] as unknown as string[]).find(c => c.startsWith('csrf_token='))!;
    const res = await request(app).post('/api/auth/login')
      .set('Cookie', cookie).set('x-csrf-token', 'wrong-value')
      .send({ email: 'a@b.com', password: 'x' });
    expect(res.status).toBe(400);
  });

  it('passes CSRF when header matches cookie (then fails on credentials, not CSRF)', async () => {
    const seed = await request(app).get('/api/health');
    const setCookie = seed.headers['set-cookie'] as unknown as string[];
    const token = csrfFrom(setCookie);
    const cookie = setCookie.find(c => c.startsWith('csrf_token='))!;
    const res = await request(app).post('/api/auth/login')
      .set('Cookie', cookie).set('x-csrf-token', token)
      .send({ email: 'nobody@example.com', password: 'whatever-long-enough' });
    expect(res.status).toBe(401); // CSRF passed → generic auth failure
    expect(res.body.error.code).toBe('unauthenticated');
  });
});

describe('CORS origin allow-list', () => {
  it('reflects the allowed origin with credentials', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://app.example.com');
    expect(res.headers['access-control-allow-origin']).toBe('https://app.example.com');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not set CORS headers for an unknown origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example.net');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects a preflight from a disallowed origin', async () => {
    const res = await request(app).options('/api/auth/login').set('Origin', 'https://evil.example.net');
    expect(res.status).toBe(403);
  });

  it('never uses a wildcard origin with credentials', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://app.example.com');
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });
});

describe('Request validation', () => {
  it('rejects unknown/extra fields and malformed email with a safe error', async () => {
    const seed = await request(app).get('/api/health');
    const setCookie = seed.headers['set-cookie'] as unknown as string[];
    const token = csrfFrom(setCookie);
    const cookie = setCookie.find(c => c.startsWith('csrf_token='))!;
    const res = await request(app).post('/api/auth/login')
      .set('Cookie', cookie).set('x-csrf-token', token)
      .send({ email: 'not-an-email', password: 'short', extra: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
    expect(JSON.stringify(res.body)).not.toContain('not-an-email'); // no echo of input
  });
});
