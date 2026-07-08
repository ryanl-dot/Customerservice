import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// In JSON dev mode (no database) MFA cannot be enrolled, so mandatory MFA must NOT
// apply — a privileged dev account must be able to sign in and use the app. This runs
// in-process (no port), against the seeded dev admin.
process.env.APP_MODE = 'development';
process.env.USER_STORE = 'json';
delete process.env.AUTH_DISABLE_SEED;          // seed users ON
process.env.SEED_PASSWORD = 'seed-pass-123456';
process.env.FRONTEND_ORIGIN = 'https://app.example.com';
process.env.COOKIE_SECRET = 'test-cookie-secret-value-1234567890';

let app: import('express').Express;
beforeAll(async () => { app = (await import('../server/src/app')).createApp(); });

async function csrf(agent: ReturnType<typeof request.agent>) {
  const res = await agent.get('/api/health');
  const raw = (res.headers['set-cookie'] as unknown as string[]).find(c => c.startsWith('csrf_token='))!;
  return decodeURIComponent(raw.split(';')[0].split('=')[1]);
}

describe('JSON dev mode does not force MFA on privileged roles', () => {
  it('a seeded administrator signs in with a full session (no MFA enrollment gate)', async () => {
    const agent = request.agent(app);
    const token = await csrf(agent);
    const login = await agent.post('/api/auth/login').set('x-csrf-token', token)
      .send({ email: 'admin@solarcs.test', password: 'seed-pass-123456' });
    expect(login.status).toBe(200);
    expect(login.body.authenticated).toBe(true);
    expect(login.body.mfaEnrollmentRequired).toBe(false); // not gated in JSON mode
    // And a protected endpoint is reachable (not blocked by an MFA-pending session).
    expect((await agent.get('/api/kpis')).status).toBe(200);
  });
});
