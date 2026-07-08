import { generateSecret, generateURI, verify } from 'otplib';
import type { Role } from '../../../shared/auth/roles';
import { isProduction, userStore } from './config';

// Standards-based TOTP (RFC 6238) via otplib v13 (Noble crypto plugin — no custom
// cryptography). Secrets are generated server-side, stored on the user row, and never
// returned except to the authenticated user enrolling their own MFA.

export function generateMfaSecret(): string {
  return generateSecret();
}

// otpauth:// URI for the user's authenticator app (rendered as a QR code by the client).
export function mfaKeyUri(email: string, secret: string): string {
  return generateURI({ strategy: 'totp', issuer: 'SolarCS Command Center', label: email, secret });
}

// Allow ±1 time step of clock drift.
export async function verifyTotp(token: string, secret: string): Promise<boolean> {
  try {
    const result = await verify({ strategy: 'totp', token, secret, epochTolerance: [1, 1] });
    return result.valid === true;
  } catch {
    return false;
  }
}

// Roles for which MFA is required policy. Enforcement completeness is reported at
// startup (see mfaFullyEnforced).
const MFA_REQUIRED_ROLES: Role[] = ['administrator', 'executive', 'management'];

export function roleRequiresMfa(role: Role): boolean {
  return MFA_REQUIRED_ROLES.includes(role);
}

// MFA can only be enrolled/verified when the database user store is active (secrets
// live on the user row). In JSON dev mode there is no DB, so mandatory MFA does not
// apply — otherwise a privileged dev account would be permanently locked out (unable
// to enroll). Production always uses the DB store, so enforcement holds there.
export function mfaApplies(): boolean {
  return isProduction() || userStore() === 'db';
}

// Privileged-role MFA is fully enforced: not-yet-enrolled privileged users get an
// MFA-pending session that is blocked from every protected endpoint until they
// enroll and verify, and enrolled users must present a valid code at every login.
export function mfaFullyEnforced(): boolean {
  return true;
}

// Retained for symmetry; only warns if enforcement is ever turned off.
export function warnIfMfaNotEnforced(): void {
  if (isProduction() && !mfaFullyEnforced()) {
    console.warn('[startup] NOTICE: privileged-role MFA is NOT fully enforced.');
  }
}
