import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { cases } from '../data/sampleData';
import type { WaitingOn } from '../data/sampleData';
import { PriorityBadge, StatusBadge } from '../components/Badge';

const TODAY = '2026-06-15';

const GROUPS: { key: WaitingOn; label: string; color: string; bg: string }[] = [
  { key: 'Installer', label: 'Installer', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { key: 'Warehouse', label: 'Warehouse', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  { key: 'Engineering', label: 'Engineering', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { key: 'Billing', label: 'Billing', color: 'text-pink-700', bg: 'bg-pink-50 border-pink-200' },
  { key: 'Utility', label: 'Utility', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  { key: 'Customer', label: 'Customer', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  { key: 'Management', label: 'Management', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  { key: 'Legal', label: 'Legal', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
];

export default function InternalWaitingBoard() {
  const activeCases = cases.filter(c => c.status !== 'Closed' && c.status !== 'Resolved');

  const total = activeCases.filter(c => c.waitingOn !== 'None').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Internal Waiting Board</h1>
        <p className="text-slate-500 text-sm">{total} cases currently waiting on internal or external teams</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {GROUPS.map(({ key, label, color, bg }) => {
          const count = activeCases.filter(c => c.waitingOn === key).length;
          return (
            <div key={key} className={`rounded-xl border p-4 ${bg}`}>
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className={`text-sm font-medium ${color}`}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* Groups */}
      {GROUPS.map(({ key, label, color, bg }) => {
        const groupCases = activeCases.filter(c => c.waitingOn === key);
        if (groupCases.length === 0) return null;
        return (
          <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className={`flex items-center gap-3 px-5 py-4 border-b border-slate-100 ${bg}`}>
              <Clock size={16} className={color} />
              <h2 className={`font-semibold text-sm ${color}`}>Waiting on {label}</h2>
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 ${color}`}>{groupCases.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Customer / Case', 'Case Type', 'Priority', 'Status', 'Owner', 'Days Waiting', 'Next Follow-Up'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {groupCases.map(c => {
                    const daysWaiting = Math.floor((new Date(TODAY).getTime() - new Date(c.lastUpdate).getTime()) / 86400000);
                    const overdue = c.nextFollowUp && c.nextFollowUp < TODAY;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link to={`/cases/${c.id}`} className="font-medium text-blue-600 hover:underline text-sm">{c.customerName}</Link>
                          <div className="text-xs text-slate-400">{c.id}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{c.caseType}</td>
                        <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-slate-600">{c.owner}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-semibold ${daysWaiting > 5 ? 'text-red-600' : daysWaiting > 2 ? 'text-orange-600' : 'text-slate-600'}`}>
                            {daysWaiting}d
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
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
    </div>
  );
}
