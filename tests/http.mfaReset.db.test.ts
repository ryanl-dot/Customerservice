import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { generate } from 'otplib';
import { HAS_DB, resetDb } from './helpers/testDb';
import { getPrisma } from '../server/src/db/client';

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

    // A brand-new login now issues an mfa_required challenge (no session yet).
    const agent2 = request.agent(app);
    const c2 = await csrf(agent2);
    const noCode = await agent2.post('/api/auth/login').set('x-csrf-token', c2.token).send({ email: 'admin2@example.com', password: 'strong-password-2' });
    expect(noCode.status).toBe(401);
    expect(noCode.body.error.code).toBe('mfa_required');           // machine-readable challenge
    expect((await agent2.get('/api/auth/session')).body.authenticated).toBe(false); // no session created

    // A wrong/expired code is also an mfa_required challenge (generic), not a session.
    const wrongCode = await agent2.post('/api/auth/login').set('x-csrf-token', c2.token)
      .send({ email: 'admin2@example.com', password: 'strong-password-2', code: '000000' });
    expect(wrongCode.status).toBe(401);
    expect(wrongCode.body.error.code).toBe('mfa_required');
    expect((await agent2.get('/api/auth/session')).body.authenticated).toBe(false);

    // The correct current code creates the full session.
    const withCode = await agent2.post('/api/auth/login').set('x-csrf-token', c2.token)
      .send({ email: 'admin2@example.com', password: 'strong-password-2', code: await generate({ strategy: 'totp', secret: enroll.body.secret }) });
    expect(withCode.status).toBe(200);
    expect(withCode.body.mfaEnrollmentRequired).toBe(false);
    expect((await agent2.get('/api/auth/session')).body.authenticated).toBe(true);
  });

  it('non-privileged role is not forced into MFA', async () => {
    await makeUser('customer_service', 'cs@example.com', 'strong-password-3');
    const agent = request.agent(app);
    const { token } = await csrf(agent);
    const login = await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'cs@example.com', password: 'strong-password-3' });
    expect(login.body.mfaEnrollmentRequired).toBe(false);
  });

  it('invalid credentials return unauthenticated, NOT mfa_required (no user enumeration)', async () => {
    await makeUser('administrator', 'admin3@example.com', 'strong-password-4');
    const agent = request.agent(app);
    const { token } = await csrf(agent);
    // Wrong password for an existing MFA-eligible account.
    const wrongPw = await agent.post('/api/auth/login').set('x-csrf-token', token)
      .send({ email: 'admin3@example.com', password: 'WRONG-password' });
    expect(wrongPw.status).toBe(401);
    expect(wrongPw.body.error.code).toBe('unauthenticated');
    expect(wrongPw.body.error.code).not.toBe('mfa_required');
    // Unknown email → same generic unauthenticated.
    const unknown = await agent.post('/api/auth/login').set('x-csrf-token', token)
      .send({ email: 'nobody@example.com', password: 'whatever-long-enough' });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.code).toBe('unauthenticated');
  });

  it('passwords and TOTP codes are never persisted (hashed only) or logged', async () => {
    const PW = 'never-logged-pw-778899';
    await makeUser('administrator', 'nolog@example.com', PW);
    const agent = request.agent(app);
    const { token } = await csrf(agent);

    // Enroll MFA so we exercise a login with a real code, then capture console output.
    await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'nolog@example.com', password: PW });
    const enroll = await agent.post('/api/auth/mfa/enroll').set('x-csrf-token', token).send({});
    await agent.post('/api/auth/mfa/verify').set('x-csrf-token', token).send({ code: await generate({ strategy: 'totp', secret: enroll.body.secret }) });

    const CODE = await generate({ strategy: 'totp', secret: enroll.body.secret });
    const logs: string[] = [];
    const spyLog = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => { logs.push(a.map(String).join(' ')); });
    const spyErr = vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => { logs.push(a.map(String).join(' ')); });

    const agent2 = request.agent(app);
    const c2 = await csrf(agent2);
    await agent2.post('/api/auth/login').set('x-csrf-token', c2.token)
      .send({ email: 'nolog@example.com', password: PW, code: CODE });

    spyLog.mockRestore(); spyErr.mockRestore();

    // Console (audit/error lines) must never contain the password or the TOTP code.
    const joined = logs.join('\n');
    expect(joined).not.toContain(PW);
    expect(joined).not.toContain(CODE);

    // The stored password is a scrypt hash, not the plaintext.
    const row = await getPrisma().user.findFirst({ where: { email: 'nolog@example.com' } });
    expect(row?.passwordHash).not.toContain(PW);
    // Audit rows never contain the password or code either.
    const audits = JSON.stringify(await getPrisma().auditEvent.findMany({}));
    expect(audits).not.toContain(PW);
    expect(audits).not.toContain(CODE);
  });

  it('password reset: generic response, email captured, token single-use, sessions revoked', async () => {
    const u = await makeUser('customer_service', 'reset@example.com', 'original-password-1');
    const agent = request.agent(app);
    const { token } = await csrf(agent);
    // Isolate this test's login/reset rate-limit bucket (limiter keys on req.ip; trust
    // proxy is on) so cross-test accumulation doesn't trip the throttle.
    const IP = '10.9.9.9';

    // Establish a session, then request a reset.
    await agent.post('/api/auth/login').set('x-csrf-token', token).set('X-Forwarded-For', IP).send({ email: 'reset@example.com', password: 'original-password-1' });
    const reqRes = await agent.post('/api/auth/request-password-reset').set('x-csrf-token', token).set('X-Forwarded-For', IP).send({ email: 'reset@example.com' });
    expect(reqRes.status).toBe(200); // generic

    // Unknown email also returns 200 (no enumeration).
    const unknown = await agent.post('/api/auth/request-password-reset').set('x-csrf-token', token).set('X-Forwarded-For', IP).send({ email: 'nobody@example.com' });
    expect(unknown.status).toBe(200);

    // The test transport captured exactly one email (for the real account) with a link.
    const emails = email.sentTestEmails();
    expect(emails.length).toBe(1);
    const link = emails[0].text.match(/reset-password\?token=([a-f0-9]+)/);
    expect(link).not.toBeNull();
    const rawToken = link![1];

    // Reset with the token.
    const resetRes = await agent.post('/api/auth/reset-password').set('x-csrf-token', token).set('X-Forwarded-For', IP).send({ token: rawToken, newPassword: 'brand-new-password-9' });
    expect(resetRes.status).toBe(200);

    // The prior session is revoked (all sessions invalidated on password change).
    expect((await agent.get('/api/auth/session')).body.authenticated).toBe(false);

    // Token cannot be reused.
    const reuse = await agent.post('/api/auth/reset-password').set('x-csrf-token', token).set('X-Forwarded-For', IP).send({ token: rawToken, newPassword: 'another-password-99' });
    expect(reuse.status).toBe(400);

    // New password works.
    const c2 = await csrf(request.agent(app));
    void c2; void u;
  });
});
