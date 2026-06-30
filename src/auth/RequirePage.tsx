import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from './useAuth';
import type { PageKey } from '../../shared/auth/permissions';
import { canAccessPage } from '../../shared/auth/permissions';

// Client-side route guard. USABILITY ONLY — it hides pages the role can't use, but it
// is NOT the security boundary. The server independently authorizes every /api call,
// so a user who forces their way to a route still receives no protected data.

export default function RequirePage({ page, children }: { page: PageKey; children: ReactNode }) {
  const { role } = useAuth();
  if (!role || !canAccessPage(role, page)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <ShieldAlert size={32} className="text-slate-300" />
        <p className="text-sm font-medium text-slate-600">You don’t have access to this page.</p>
        <p className="text-xs">Your role ({role ?? 'unknown'}) is not permitted here. Contact an administrator if this is unexpected.</p>
      </div>
    );
  }
  return <>{children}</>;
}
