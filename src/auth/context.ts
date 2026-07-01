import { createContext } from 'react';
import type { AuthUser } from '../../shared/auth/session';
import type { Role } from '../../shared/auth/roles';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  role: Role | null;
  expired: boolean;
  /** Privileged user must complete MFA enrollment before using the app. */
  mfaEnrollmentRequired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);
