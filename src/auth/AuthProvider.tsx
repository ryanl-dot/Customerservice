import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../../shared/auth/session';
import { AuthContext, type AuthState, type AuthStatus, type LoginResult } from './context';
import * as authClient from './authClient';
import { AuthError } from './authClient';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [expired, setExpired] = useState(false);
  const [mfaEnrollmentRequired, setMfaRequired] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const info = await authClient.fetchSession();
      if (info.authenticated && info.user) {
        setUser(info.user);
        setMfaRequired(Boolean(info.mfaEnrollmentRequired));
        setStatus('authenticated');
      } else {
        setUser(null);
        setMfaRequired(false);
        setStatus('unauthenticated');
      }
    } catch {
      // API unreachable → treat as unauthenticated; the login screen surfaces the error.
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  // Check the session once on mount (external-system sync — state is set only after
  // the async fetch resolves, not synchronously during render).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, [refresh]);

  // Re-validate on tab focus so an expired session bumps the user to login promptly.
  useEffect(() => {
    function onFocus() { if (status === 'authenticated') void refresh(); }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [status, refresh]);

  const login = useCallback(async (email: string, password: string, code?: string): Promise<LoginResult> => {
    try {
      const info = await authClient.login(email, password, code);
      if (info.authenticated && info.user) {
        setExpired(false);
        setUser(info.user);
        setMfaRequired(Boolean(info.mfaEnrollmentRequired));
        setStatus('authenticated');
        return { status: 'ok' };
      }
      throw new Error('Login failed.');
    } catch (err) {
      // Password verified but a TOTP code is needed/invalid → signal the MFA step
      // WITHOUT creating a session. Any other error propagates to the caller.
      if (err instanceof AuthError && err.code === 'mfa_required') {
        return { status: 'mfa_required' };
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await authClient.logout();
    setUser(null);
    setExpired(false);
    setMfaRequired(false);
    setStatus('unauthenticated');
  }, []);

  const value: AuthState = {
    status, user, role: user?.role ?? null, expired, mfaEnrollmentRequired, login, logout, refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
