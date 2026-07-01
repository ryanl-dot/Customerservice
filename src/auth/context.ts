import { createContext } from 'react';
import type { AuthUser } from '../../shared/auth/session';
import type { Role } from '../../shared/auth/roles';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// Result of a login attempt: fully signed in, or a TOTP challenge is required.
export type LoginResult = { status: 'ok' } | { status: 'mfa_required' };

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  role: Role | null;
  expired: boolean;
  /** Privileged user must complete MFA enrollment before using the app. */
  mfaEnrollmentRequired: boolean;
  login: (email: string, password: string, code?: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);
