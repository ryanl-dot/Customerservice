// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Login from '../src/pages/Login';
import { AuthContext, type AuthState } from '../src/auth/context';

// Renders <Login> with a mock auth context so we can drive the login() contract.
function renderLogin(login: AuthState['login']) {
  const value: AuthState = {
    status: 'unauthenticated', user: null, role: null, expired: false,
    mfaEnrollmentRequired: false, login,
    logout: async () => {}, refresh: async () => {},
  };
  return render(<AuthContext.Provider value={value}><Login /></AuthContext.Provider>);
}

function submitCredentials() {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@solarcs.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'a-strong-password' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
}

beforeEach(() => cleanup());

describe('Login MFA flow', () => {
  it('shows only email + password initially (no code field)', () => {
    renderLogin(async () => ({ status: 'ok' }));
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.queryByLabelText('Authentication code')).toBeNull();
  });

  it('reveals the MFA code field when the API responds mfa_required', async () => {
    const login = vi.fn<AuthState['login']>().mockResolvedValue({ status: 'mfa_required' });
    renderLogin(login);
    submitCredentials();
    await waitFor(() => expect(screen.getByLabelText('Authentication code')).toBeTruthy());
    expect(screen.getByRole('button', { name: /verify/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /back to sign-in/i })).toBeTruthy();
  });

  it('a correct code completes login (sends the code to the backend)', async () => {
    const login = vi.fn<AuthState['login']>()
      .mockResolvedValueOnce({ status: 'mfa_required' })  // step 1
      .mockResolvedValueOnce({ status: 'ok' });           // step 2 with code
    renderLogin(login);
    submitCredentials();
    await waitFor(() => screen.getByLabelText('Authentication code'));
    fireEvent.change(screen.getByLabelText('Authentication code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(login).toHaveBeenCalledTimes(2));
    expect(login).toHaveBeenLastCalledWith('admin@solarcs.test', 'a-strong-password', '123456');
  });

  it('never writes the password or TOTP code to localStorage/sessionStorage', async () => {
    localStorage.clear(); sessionStorage.clear();
    const login = vi.fn<AuthState['login']>()
      .mockResolvedValueOnce({ status: 'mfa_required' })
      .mockResolvedValueOnce({ status: 'ok' });
    renderLogin(login);
    submitCredentials();
    await waitFor(() => screen.getByLabelText('Authentication code'));
    fireEvent.change(screen.getByLabelText('Authentication code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(login).toHaveBeenCalledTimes(2));
    const dumped = JSON.stringify(localStorage) + JSON.stringify(sessionStorage);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(dumped).not.toContain('a-strong-password');
    expect(dumped).not.toContain('123456');
  });

  it('an incorrect/expired code shows a generic error and stays on the MFA step', async () => {
    const login = vi.fn<AuthState['login']>()
      .mockResolvedValueOnce({ status: 'mfa_required' })
      .mockResolvedValueOnce({ status: 'mfa_required' }); // bad code → still challenged
    renderLogin(login);
    submitCredentials();
    await waitFor(() => screen.getByLabelText('Authentication code'));
    fireEvent.change(screen.getByLabelText('Authentication code'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(screen.getByText(/invalid or expired authentication code/i)).toBeTruthy());
    expect(screen.getByLabelText('Authentication code')).toBeTruthy(); // still on MFA step
  });

  it('the Verify button is disabled until a 6-digit code is entered (missing code cannot submit)', async () => {
    renderLogin(vi.fn<AuthState['login']>().mockResolvedValue({ status: 'mfa_required' }));
    submitCredentials();
    await waitFor(() => screen.getByLabelText('Authentication code'));
    const verify = screen.getByRole('button', { name: /verify/i }) as HTMLButtonElement;
    expect(verify.disabled).toBe(true); // no code yet
    fireEvent.change(screen.getByLabelText('Authentication code'), { target: { value: '123' } });
    expect(verify.disabled).toBe(true); // too short
    fireEvent.change(screen.getByLabelText('Authentication code'), { target: { value: '123456' } });
    expect(verify.disabled).toBe(false);
  });

  it('Back to sign-in returns to the credentials step', async () => {
    renderLogin(vi.fn<AuthState['login']>().mockResolvedValue({ status: 'mfa_required' }));
    submitCredentials();
    await waitFor(() => screen.getByLabelText('Authentication code'));
    fireEvent.click(screen.getByRole('button', { name: /back to sign-in/i }));
    await waitFor(() => expect(screen.queryByLabelText('Authentication code')).toBeNull());
    expect(screen.getByLabelText('Email')).toBeTruthy();
  });

  it('a non-MFA login error is shown on the credentials step', async () => {
    const login = vi.fn<AuthState['login']>().mockRejectedValue(new Error('Invalid email or password.'));
    renderLogin(login);
    submitCredentials();
    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeTruthy());
    expect(screen.queryByLabelText('Authentication code')).toBeNull();
  });
});
