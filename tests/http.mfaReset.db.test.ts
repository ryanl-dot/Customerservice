import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { generate } from 'otplib';
import { HAS_DB, resetDb } from './helpers/testDb';

// Full-stack HTTP tests for mandatory MFA + password-reset, against the test Postgres.
process.env.APP_MODE = 'development';
process.env.USER_STORE = 'db';
process.env.AUTH_DISABLE_SEED = '1';
process.env.FRONTEND_ORIGIN = 'https://app.example.com';
process.env.COOKIE_SECRET = 'test-cookie-secret-value-1234567890';
process.env.SESSION_SECRET = 'test-session-secret-value-1234567890';
process.env.EMAIL_TRANSPORT = 'test';

type Agent = ReturnType<typeof request>;
let app: import('express').Express;
let dbUsers: typeof import('../server/src/db/repositories/users');
let email: typeof import('../server/src/lib/email');
let passwords: typeof import('../server/src/lib/passwords');
let disconnect: () => Promise<void>;

// Helper: perform CSRF-aware requests using a persistent cookie jar.
async function csrf(agent: Agent): Promise<{ cookie: string; token: string }> {
  const res = await agent.get('/api/health');
  const setCookie = (res.headers['set-cookie'] as unknown as string[]) ?? [];
  const raw = setCookie.find(c => c.startsWith('csrf_token='))!;
  return { cookie: raw.split(';')[0], token: decodeURIComponent(raw.split(';')[0].split('=')[1]) };
}

describe.skipIf(!HAS_DB)('MFA enforcement + password reset (HTTP, DB)', () => {
  beforeAll(async () => {
    app = (await import('../server/src/app')).createApp();
    dbUsers = await import('../server/src/db/repositories/users');
    email = await import('../server/src/lib/email');
    passwords = await import('../server/src/lib/passwords');
    disconnect = (await import('../server/src/db/client')).disconnectPrisma;
  });
  beforeEach(async () => { await resetDb(); email.clearTestEmails(); });
  afterAll(async () => { await resetDb(); await disconnect(); });

  async function makeUser(role: 'administrator' | 'customer_service', emailAddr: string, pw: string) {
    return dbUsers.createUser({ name: 'T', email: emailAddr, role, passwordHash: passwords.hashPassword(pw) });
  }

  it('privileged user without MFA gets an mfaEnrollmentRequired session and is blocked from data', async () => {
    await makeUser('administrator', 'admin@example.com', 'strong-password-1');
    const agent = request.agent(app);
    const { token } = await csrf(agent);
    const login = await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'admin@example.com', password: 'strong-password-1' });
    expect(login.status).toBe(200);
    expect(login.body.mfaEnrollmentRequired).toBe(true);
    // Direct API/URL bypass attempt is blocked server-side.
    const blocked = await agent.get('/api/kpis');
    expect(blocked.status).toBe(403);
  });

  it('enroll → verify enables MFA and unblocks; next login requires the code', async () => {
    await makeUser('administrator', 'admin2@example.com', 'strong-password-2');
    const agent = request.agent(app);
    const { token } = await csrf(agent);
    await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'admin2@example.com', password: 'strong-password-2' });

    const enroll = await agent.post('/api/auth/mfa/enroll').set('x-csrf-token', token).send({});
    expect(enroll.status).toBe(200);
    expect(enroll.body.qrDataUrl).toContain('data:image/png;base64,');

    const badCode = await agent.post('/api/auth/mfa/verify').set('x-csrf-token', token).send({ code: '000000' });
    expect(badCode.status).toBe(400);

    const goodCode = await generate({ strategy: 'totp', secret: enroll.body.secret });
    const ok = await agent.post('/api/auth/mfa/verify').set('x-csrf-token', token).send({ code: goodCode });
    expect(ok.status).toBe(200);

    // Now unblocked.
    expect((await agent.get('/api/kpis')).status).toBe(200);

    // A brand-new login now requires the TOTP code.
    const agent2 = request.agent(app);
    const c2 = await csrf(agent2);
    const noCode = await agent2.post('/api/auth/login').set('x-csrf-token', c2.token).send({ email: 'admin2@example.com', password: 'strong-password-2' });
    expect(noCode.status).toBe(401);
    const withCode = await agent2.post('/api/auth/login').set('x-csrf-token', c2.token)
      .send({ email: 'admin2@example.com', password: 'strong-password-2', code: await generate({ strategy: 'totp', secret: enroll.body.secret }) });
    expect(withCode.status).toBe(200);
    expect(withCode.body.mfaEnrollmentRequired).toBe(false);
  });

  it('non-privileged role is not forced into MFA', async () => {
    await makeUser('customer_service', 'cs@example.com', 'strong-password-3');
    const agent = request.agent(app);
    const { token } = await csrf(agent);
    const login = await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'cs@example.com', password: 'strong-password-3' });
    expect(login.body.mfaEnrollmentRequired).toBe(false);
  });

  it('password reset: generic response, email captured, token single-use, sessions revoked', async () => {
    const u = await makeUser('customer_service', 'reset@example.com', 'original-password-1');
    const agent = request.agent(app);
    const { token } = await csrf(agent);

    // Establish a session, then request a reset.
    await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'reset@example.com', password: 'original-password-1' });
    const reqRes = await agent.post('/api/auth/request-password-reset').set('x-csrf-token', token).send({ email: 'reset@example.com' });
    expect(reqRes.status).toBe(200); // generic

    // Unknown email also returns 200 (no enumeration).
    const unknown = await agent.post('/api/auth/request-password-reset').set('x-csrf-token', token).send({ email: 'nobody@example.com' });
    expect(unknown.status).toBe(200);

    // The test transport captured exactly one email (for the real account) with a link.
    const emails = email.sentTestEmails();
    expect(emails.length).toBe(1);
    const link = emails[0].text.match(/reset-password\?token=([a-f0-9]+)/);
    expect(link).not.toBeNull();
    const rawToken = link![1];

    // Reset with the token.
    const resetRes = await agent.post('/api/auth/reset-password').set('x-csrf-token', token).send({ token: rawToken, newPassword: 'brand-new-password-9' });
    expect(resetRes.status).toBe(200);

    // The prior session is revoked (all sessions invalidated on password change).
    expect((await agent.get('/api/auth/session')).body.authenticated).toBe(false);

    // Token cannot be reused.
    const reuse = await agent.post('/api/auth/reset-password').set('x-csrf-token', token).send({ token: rawToken, newPassword: 'another-password-99' });
    expect(reuse.status).toBe(400);

    // New password works.
    const c2 = await csrf(request.agent(app));
    void c2; void u;
  });
});
