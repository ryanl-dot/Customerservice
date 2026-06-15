import { Link } from 'react-router-dom';
import { AlertCircle, Calendar, Clock, Users, RefreshCw, Building2, CheckCircle2 } from 'lucide-react';
import { cases, truckRolls } from '../data/sampleData';
import { PriorityBadge, StatusBadge, RiskBadge } from '../components/Badge';
import { isOverdue, isDueToday, hasNoRecentUpdate, daysOpen, daysSinceLastUpdate, computeRisk, TODAY } from '../utils/caseLogic';

const THIS_WEEK_END = '2026-06-21';

function CaseRow({ c }: { c: typeof cases[0] }) {
  const tr = truckRolls.find(t => t.id === c.truckRollId);
  const risk = computeRisk(c, tr);
  const overdue = isOverdue(c);
  const dueToday = isDueToday(c);
  const since = daysSinceLastUpdate(c);
  const open = daysOpen(c);
  return (
    <tr className={`hover:bg-slate-50 border-b border-slate-100 ${overdue ? 'bg-red-50/20' : ''}`}>
      <td className="px-3 py-2.5">
        <Link to={`/cases/${c.id}`} className="font-medium text-blue-600 hover:text-blue-700 block text-xs">{c.customerName}</Link>
        <span className="text-[10px] text-slate-400">{c.id} · {c.caseType}</span>
      </td>
      <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{c.owner}</td>
      <td className="px-3 py-2.5"><PriorityBadge priority={c.priority} /></td>
      <td className="px-3 py-2.5"><RiskBadge level={risk.level} /></td>
      <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className={`text-xs font-medium ${overdue ? 'text-red-600' : dueToday ? 'text-amber-600' : 'text-slate-500'}`}>
          {overdue ? '⚠ ' : dueToday ? '📅 ' : ''}{c.nextFollowUp || '—'}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <span className={`text-xs ${since >= 3 ? 'text-orange-600 font-medium' : 'text-slate-400'}`}>
          {since === 0 ? 'Today' : `${since}d ago`}
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-slate-400">{open}d</td>
    </tr>
  );
}

function Section({ title, icon: Icon, accent, cases: sectionCases, emptyText }: {
  title: string;
  icon: React.ElementType;
  accent: string;
  cases: typeof cases;
  emptyText: string;
}) {
  if (sectionCases.length === 0) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg overflow-hidden`}>
        <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${accent}`}>
          <Icon size={14} />
          <span className="text-sm font-semibold">{title}</span>
          <span className="ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white/50">0</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-400">
          <CheckCircle2 size={13} className="text-emerald-400" /> {emptyText}
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${accent}`}>
        <Icon size={14} />
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white/50">{sectionCases.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-sticky">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Customer / Case', 'Owner', 'Priority', 'Risk', 'Status', 'Follow-Up Date', 'Last Update', 'Days Open'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectionCases.map(c => <CaseRow key={c.id} c={c} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FollowUpCenter() {
  const active = cases.filter(c => c.status !== 'Closed' && c.status !== 'Resolved');
  const overdue = active.filter(isOverdue);
  const dueToday = active.filter(isDueToday);
  const upcomingWeek = active.filter(c => c.nextFollowUp && c.nextFollowUp > TODAY && c.nextFollowUp <= THIS_WEEK_END);
  const noUpdate = active.filter(c => hasNoRecentUpdate(c) && !isOverdue(c));
  const waitingCustomer = active.filter(c => c.status === 'Waiting on Customer');
  const waitingInternal = active.filter(c => c.status === 'Waiting on Internal Team');

  const chips = [
    { label: 'Overdue',            count: overdue.length,        cls: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
    { label: 'Due Today',          count: dueToday.length,       cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
    { label: 'This Week',          count: upcomingWeek.length,   cls: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' },
    { label: 'No Update 3d+',      count: noUpdate.length,       cls: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' },
    { label: 'Wait on Customer',   count: waitingCustomer.length,cls: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200' },
    { label: 'Wait on Internal',   count: waitingInternal.length,cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
  ];

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Follow-Up Center</h1>
        <p className="text-xs text-slate-400 mt-0.5">June 15, 2026 — All pending follow-ups by category</p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map(({ label, count, cls }) => (
          <div key={label} className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium ${cls}`}>
            <span>{label}</span>
            <span className="font-bold">{count}</span>
          </div>
        ))}
      </div>

      <Section title="Overdue Follow-Ups"    icon={AlertCircle}  accent="text-red-700 bg-red-50 border-red-100"       cases={overdue}        emptyText="No overdue follow-ups." />
      <Section title="Due Today"              icon={Calendar}     accent="text-amber-700 bg-amber-50 border-amber-100"  cases={dueToday}       emptyText="Nothing due today — you're all caught up." />
      <Section title="Upcoming This Week"     icon={Clock}        accent="text-sky-700 bg-sky-50 border-sky-100"        cases={upcomingWeek}   emptyText="No upcoming follow-ups this week." />
      <Section title="No Update in 3+ Days"   icon={RefreshCw}    accent="text-orange-700 bg-orange-50 border-orange-100" cases={noUpdate}     emptyText="All cases have recent updates." />
      <Section title="Waiting on Customer"    icon={Users}        accent="text-yellow-700 bg-yellow-50 border-yellow-100" cases={waitingCustomer} emptyText="No cases waiting on customer." />
      <Section title="Waiting on Internal"    icon={Building2}    accent="text-slate-700 bg-slate-50 border-slate-200"  cases={waitingInternal} emptyText="No cases waiting on internal team." />
    </div>
  );
}
