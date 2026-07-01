import { generateSecret, generateURI, verify } from 'otplib';
import type { Role } from '../../../shared/auth/roles';
import { isProduction } from './config';

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

// Whether forced privileged-role MFA enrollment is fully enforced. Second-factor at
// login IS enforced for enrolled users; forced-enrollment gating for not-yet-enrolled
// privileged users is NOT implemented in this phase, so this returns false.
export function mfaFullyEnforced(): boolean {
  return false;
}

// Emit a clear startup notice in production while enforcement is incomplete.
export function warnIfMfaNotEnforced(): void {
  if (isProduction() && !mfaFullyEnforced()) {
    console.warn('[startup] NOTICE: privileged-role MFA is NOT fully enforced yet (second factor is verified for enrolled users, but not-yet-enrolled privileged accounts are not blocked). NOT ready for real customer data.');
  }
}
