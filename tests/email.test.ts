import { describe, it, expect, afterEach } from 'vitest';
import { passwordResetMessage } from '../server/src/lib/email/mailer';

afterEach(() => { delete process.env.APP_MODE; delete process.env.EMAIL_TRANSPORT; });

describe('Email transport selection', () => {
  it('password-reset template contains the link but no internal system details', () => {
    const msg = passwordResetMessage('user@example.com', 'https://app.example.com/reset-password?token=abc');
    expect(msg.subject).toMatch(/reset/i);
    expect(msg.text).toContain('reset-password?token=abc');
    expect(msg.html).toContain('reset-password?token=abc');
    // No internal detail leakage.
    expect(JSON.stringify(msg)).not.toMatch(/passwordHash|DATABASE_URL|stack|prisma|secret/i);
  });

  it('non-production defaults to the non-delivering test transport', async () => {
    process.env.APP_MODE = 'development';
    delete process.env.EMAIL_TRANSPORT;
    const { getMailer } = await import('../server/src/lib/email');
    expect(getMailer().name).toBe('test');
  });

  it('production refuses a non-provider (console/test) transport', async () => {
    process.env.APP_MODE = 'production';
    process.env.EMAIL_TRANSPORT = 'test';
    const { getMailer } = await import('../server/src/lib/email');
    expect(() => getMailer()).toThrow();
  });

  it('production selects the resend provider when configured', async () => {
    process.env.APP_MODE = 'production';
    process.env.EMAIL_TRANSPORT = 'resend';
    const { getMailer } = await import('../server/src/lib/email');
    expect(getMailer().name).toBe('resend');
  });
});
