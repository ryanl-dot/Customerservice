import { Link } from 'react-router-dom';
import { AlertCircle, Clock, Calendar, Users, RefreshCw, Building } from 'lucide-react';
import { cases } from '../data/sampleData';
import { PriorityBadge, StatusBadge } from '../components/Badge';

const TODAY = '2026-06-15';
const THIS_WEEK_END = '2026-06-21';
const THREE_DAYS_AGO = '2026-06-12';

function CaseRow({ c }: { c: typeof cases[0] }) {
  return (
    <tr className="hover:bg-slate-50 border-b border-slate-50">
      <td className="px-4 py-3">
        <Link to={`/cases/${c.id}`} className="font-medium text-blue-600 hover:underline block text-sm">{c.customerName}</Link>
        <span className="text-xs text-slate-400">{c.id} · {c.caseType}</span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{c.owner}</td>
      <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
      <td className="px-4 py-3 text-sm text-slate-500">{c.nextFollowUp || '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{c.lastUpdate}</td>
    </tr>
  );
}

function Section({ title, icon: Icon, color, cases, emptyText }: {
  title: string; icon: any; color: string; cases: typeof import('../data/sampleData').cases; emptyText: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className={`flex items-center gap-3 px-5 py-4 border-b border-slate-100 ${color}`}>
        <Icon size={16} />
        <h2 className="font-semibold text-sm">{title}</h2>
        <span className="ml-auto text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full">{cases.length}</span>
      </div>
      {cases.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-400">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Customer / Case', 'Owner', 'Priority', 'Status', 'Follow-Up Date', 'Last Update'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map(c => <CaseRow key={c.id} c={c} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function FollowUpCenter() {
  const active = cases.filter(c => c.status !== 'Closed' && c.status !== 'Resolved');

  const overdue = active.filter(c => c.nextFollowUp && c.nextFollowUp < TODAY);
  const dueToday = active.filter(c => c.nextFollowUp === TODAY);
  const upcomingWeek = active.filter(c => c.nextFollowUp && c.nextFollowUp > TODAY && c.nextFollowUp <= THIS_WEEK_END);
  const noUpdate = active.filter(c => c.lastUpdate < THREE_DAYS_AGO && !overdue.includes(c));
  const waitingCustomer = active.filter(c => c.status === 'Waiting on Customer');
  const waitingInternal = active.filter(c => c.status === 'Waiting on Internal Team');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Follow-Up Center</h1>
        <p className="text-slate-500 text-sm">Track all pending follow-ups by category — June 15, 2026</p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Overdue', count: overdue.length, color: 'bg-red-100 text-red-700 border border-red-200' },
          { label: 'Due Today', count: dueToday.length, color: 'bg-amber-100 text-amber-700 border border-amber-200' },
          { label: 'This Week', count: upcomingWeek.length, color: 'bg-blue-100 text-blue-700 border border-blue-200' },
          { label: 'No Update 3+ Days', count: noUpdate.length, color: 'bg-orange-100 text-orange-700 border border-orange-200' },
          { label: 'Waiting on Customer', count: waitingCustomer.length, color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
          { label: 'Waiting on Internal', count: waitingInternal.length, color: 'bg-slate-100 text-slate-600 border border-slate-200' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${color}`}>
            <span>{label}</span>
            <span className="font-bold">{count}</span>
          </div>
        ))}
      </div>

      <Section title="⚠ Overdue Follow-Ups" icon={AlertCircle} color="text-red-700 bg-red-50" cases={overdue} emptyText="No overdue follow-ups." />
      <Section title="📅 Due Today" icon={Calendar} color="text-amber-700 bg-amber-50" cases={dueToday} emptyText="No follow-ups due today." />
      <Section title="📆 Upcoming This Week" icon={Clock} color="text-blue-700 bg-blue-50" cases={upcomingWeek} emptyText="No upcoming follow-ups this week." />
      <Section title="🕐 No Update in 3+ Days" icon={RefreshCw} color="text-orange-700 bg-orange-50" cases={noUpdate} emptyText="All cases have recent updates." />
      <Section title="👤 Waiting on Customer" icon={Users} color="text-yellow-700 bg-yellow-50" cases={waitingCustomer} emptyText="No cases waiting on customer." />
      <Section title="🏢 Waiting on Internal Team" icon={Building} color="text-slate-700 bg-slate-50" cases={waitingInternal} emptyText="No cases waiting on internal team." />
    </div>
  );
}
