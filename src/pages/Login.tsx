import { useState } from 'react';
import { Sun, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

export default function Login() {
  const { login, expired } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-9 h-9 bg-amber-400 rounded-md flex items-center justify-center">
            <Sun size={18} className="text-slate-900" />
          </div>
          <div>
            <div className="text-slate-800 font-semibold leading-none">SolarCS</div>
            <div className="text-slate-500 text-[11px] mt-0.5 leading-none">Command Center</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-sm">
          <h1 className="text-sm font-semibold text-slate-700">Sign in</h1>

          {expired && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 ring-1 ring-amber-200 rounded-md px-3 py-2">
              <AlertCircle size={13} /> Your session expired. Please sign in again.
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 ring-1 ring-red-200 rounded-md px-3 py-2">
              <AlertCircle size={13} /> {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <button
            type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium rounded-md py-2 hover:bg-slate-800 disabled:opacity-60 transition-colors"
          >
            <LogIn size={14} /> {busy ? 'Signing in…' : 'Sign in'}
          </button>

          {import.meta.env.DEV && (
            <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
              Dev mode: seeded accounts are <code>cs@</code>, <code>ops@</code>, <code>compliance@</code>,
              <code>manager@</code>, <code>exec@</code>, <code>admin@</code>, <code>dev@</code> <code>solarcs.test</code>.
              Password is the server’s <code>SEED_PASSWORD</code>. Requires <code>npm run dev:server</code>.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
