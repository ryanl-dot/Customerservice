import { useState } from 'react';
import { Sun, AlertCircle, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '../auth/authClient';

// Public reset page reached from an emailed link: /reset-password?token=...
export default function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 12) { setError('Password must be at least 12 characters.'); return; }
    if (pw !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await resetPassword(token, pw);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-9 h-9 bg-amber-400 rounded-md flex items-center justify-center"><Sun size={18} className="text-slate-900" /></div>
          <div><div className="text-slate-800 font-semibold leading-none">SolarCS</div><div className="text-slate-500 text-[11px] mt-0.5">Command Center</div></div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          {done ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 size={16} /> Password reset. You can now sign in.
            </div>
          ) : !token ? (
            <div className="flex items-center gap-2 text-xs text-red-700"><AlertCircle size={14} /> Missing or invalid reset link.</div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <h1 className="text-sm font-semibold text-slate-700">Choose a new password</h1>
              {error && <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 ring-1 ring-red-200 rounded-md px-3 py-2"><AlertCircle size={13} /> {error}</div>}
              <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="New password (min 12 chars)" required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <button type="submit" disabled={busy} className="w-full bg-slate-900 text-white text-sm font-medium rounded-md py-2 hover:bg-slate-800 disabled:opacity-60">
                {busy ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          )}
          <a href="/" className="mt-3 inline-block text-xs text-blue-600 hover:underline">Back to sign in</a>
        </div>
      </div>
    </div>
  );
}
