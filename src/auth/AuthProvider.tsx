import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../../shared/auth/session';
import { AuthContext, type AuthState, type AuthStatus } from './context';
import * as authClient from './authClient';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [expired, setExpired] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const info = await authClient.fetchSession();
      if (info.authenticated && info.user) {
        setUser(info.user);
        setStatus('authenticated');
      } else {
        setUser(null);
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

  const login = useCallback(async (email: string, password: string) => {
    const info = await authClient.login(email, password);
    if (info.authenticated && info.user) {
      setExpired(false);
      setUser(info.user);
      setStatus('authenticated');
    } else {
      throw new Error('Login failed.');
    }
  }, []);

  const logout = useCallback(async () => {
    await authClient.logout();
    setUser(null);
    setExpired(false);
    setStatus('unauthenticated');
  }, []);

  const value: AuthState = {
    status, user, role: user?.role ?? null, expired, login, logout, refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
