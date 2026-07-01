import { describe, it, expect } from 'vitest';
import { generate } from 'otplib';
import { generateMfaSecret, mfaKeyUri, verifyTotp, roleRequiresMfa, mfaFullyEnforced } from '../server/src/lib/mfa';

describe('MFA (TOTP)', () => {
  it('generates a secret and a valid otpauth enrollment URI', () => {
    const secret = generateMfaSecret();
    expect(secret.length).toBeGreaterThan(10);
    const uri = mfaKeyUri('admin@example.com', secret);
    expect(uri.startsWith('otpauth://totp/')).toBe(true);
    expect(uri).toContain('SolarCS');
  });

  it('verifies a correct current code and rejects a wrong one', async () => {
    const secret = generateMfaSecret();
    const good = await generate({ strategy: 'totp', secret });
    expect(await verifyTotp(good, secret)).toBe(true);
    expect(await verifyTotp('000000', secret)).toBe(false);
    expect(await verifyTotp('not-a-code', secret)).toBe(false);
  });

  it('requires MFA for administrator, executive, and management', () => {
    expect(roleRequiresMfa('administrator')).toBe(true);
    expect(roleRequiresMfa('executive')).toBe(true);
    expect(roleRequiresMfa('management')).toBe(true);
    expect(roleRequiresMfa('customer_service')).toBe(false);
  });

  it('reports privileged-role MFA as fully enforced (pending sessions are blocked)', () => {
    expect(mfaFullyEnforced()).toBe(true);
  });
});
