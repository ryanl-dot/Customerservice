import { Link } from 'react-router-dom';
import { Clock, CheckCircle2 } from 'lucide-react';
import { cases } from '../data/sampleData';
import type { WaitingOn } from '../data/sampleData';
import { PriorityBadge, StatusBadge } from '../components/Badge';

const TODAY = '2026-06-15';

const GROUPS: { key: WaitingOn; label: string; color: string; accent: string }[] = [
  { key: 'Installer',   label: 'Installer',   color: 'text-blue-700',   accent: 'bg-blue-50 border-blue-100 text-blue-700' },
  { key: 'Warehouse',   label: 'Warehouse',   color: 'text-indigo-700', accent: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
  { key: 'Engineering', label: 'Engineering', color: 'text-purple-700', accent: 'bg-purple-50 border-purple-100 text-purple-700' },
  { key: 'Billing',     label: 'Billing',     color: 'text-pink-700',   accent: 'bg-pink-50 border-pink-100 text-pink-700' },
  { key: 'Utility',     label: 'Utility',     color: 'text-amber-700',  accent: 'bg-amber-50 border-amber-100 text-amber-700' },
  { key: 'Customer',    label: 'Customer',    color: 'text-yellow-700', accent: 'bg-yellow-50 border-yellow-100 text-yellow-700' },
  { key: 'Management',  label: 'Management',  color: 'text-red-700',    accent: 'bg-red-50 border-red-100 text-red-700' },
  { key: 'Legal',       label: 'Legal',       color: 'text-rose-700',   accent: 'bg-rose-50 border-rose-100 text-rose-700' },
];

export default function InternalWaitingBoard() {
  const activeCases = cases.filter(c => c.status !== 'Closed' && c.status !== 'Resolved');
  const total = activeCases.filter(c => c.waitingOn !== 'None').length;

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Internal Waiting Board</h1>
        <p className="text-xs text-slate-400 mt-0.5">{total} cases waiting on internal or external teams</p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {GROUPS.map(({ key, label, accent }) => {
          const count = activeCases.filter(c => c.waitingOn === key).length;
          if (count === 0) return null;
          return (
            <div key={key} className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium ring-1 ${accent}`}>
              <span>{label}</span>
              <span className="font-bold">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Groups */}
      {GROUPS.map(({ key, label, accent }) => {
        const groupCases = activeCases.filter(c => c.waitingOn === key);
        if (groupCases.length === 0) return null;
        return (
          <div key={key} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${accent}`}>
              <Clock size={13} />
              <span className="text-sm font-semibold">Waiting on {label}</span>
              <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/60">{groupCases.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-sticky">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Customer / Case', 'Case Type', 'Priority', 'Status', 'Owner', 'Days Waiting', 'Next Follow-Up'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {groupCases.map(c => {
                    const daysWaiting = Math.floor((new Date(TODAY).getTime() - new Date(c.lastUpdate).getTime()) / 86400000);
                    const overdue = c.nextFollowUp && c.nextFollowUp < TODAY;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5">
                          <Link to={`/cases/${c.id}`} className="font-medium text-blue-600 hover:text-blue-700 text-xs block">{c.customerName}</Link>
                          <span className="text-[10px] text-slate-400">{c.id}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{c.caseType}</td>
                        <td className="px-3 py-2.5"><PriorityBadge priority={c.priority} /></td>
                        <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                        <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{c.owner}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-semibold ${daysWaiting > 5 ? 'text-red-600' : daysWaiting > 2 ? 'text-orange-600' : 'text-slate-600'}`}>
                            {daysWaiting}d
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                            {overdue && '⚠ '}{c.nextFollowUp || '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {total === 0 && (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-emerald-600 bg-white border border-slate-200 rounded-lg">
          <CheckCircle2 size={15} /> No cases are currently waiting on any team.
        </div>
      )}
    </div>
  );
}
