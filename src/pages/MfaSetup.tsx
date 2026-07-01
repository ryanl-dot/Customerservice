import { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { mfaEnroll, mfaVerify, type MfaEnrollResponse } from '../auth/authClient';

// Mandatory MFA enrollment screen for privileged roles. Shown when the session is
// authenticated but MFA-pending. The server independently blocks all protected
// endpoints until enrollment completes, so this cannot be bypassed by URL.
export default function MfaSetup() {
  const { user, logout, refresh } = useAuth();
  const [enroll, setEnroll] = useState<MfaEnrollResponse | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    mfaEnroll().then(r => { if (active) setEnroll(r); }).catch(() => { if (active) setError('Could not start MFA setup.'); });
    return () => { active = false; };
  }, []);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await mfaVerify(code.trim());
      await refresh(); // clears mfaEnrollmentRequired → app loads
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={18} className="text-red-600" />
          <h1 className="text-sm font-semibold text-slate-800">Two-factor authentication required</h1>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Your role ({user?.role}) requires MFA. Scan the QR code with an authenticator app
          (or enter the key manually), then enter the 6-digit code to finish.
        </p>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 ring-1 ring-red-200 rounded-md px-3 py-2 mb-3">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {enroll ? (
          <>
            <div className="flex flex-col items-center gap-2 mb-4">
              <img src={enroll.qrDataUrl} alt="MFA QR code" width={200} height={200} className="rounded-md ring-1 ring-slate-200" />
              <div className="text-[10px] text-slate-400">Manual setup key</div>
              <code className="text-xs bg-slate-100 rounded px-2 py-1 break-all">{enroll.secret}</code>
            </div>
            <form onSubmit={onVerify} className="space-y-3">
              <input
                inputMode="numeric" autoComplete="one-time-code" value={code}
                onChange={e => setCode(e.target.value)} placeholder="123456" required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button type="submit" disabled={busy || code.trim().length !== 6}
                className="w-full bg-slate-900 text-white text-sm font-medium rounded-md py-2 hover:bg-slate-800 disabled:opacity-60">
                {busy ? 'Verifying…' : 'Verify & enable MFA'}
              </button>
            </form>
          </>
        ) : (
          <p className="text-xs text-slate-400">Preparing secure setup…</p>
        )}

        <button onClick={() => { void logout(); }} className="mt-4 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
          <LogOut size={12} /> Sign out
        </button>
      </div>
    </div>
  );
}
