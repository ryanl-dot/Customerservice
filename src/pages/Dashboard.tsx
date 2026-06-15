import { Link } from 'react-router-dom';
import {
  FolderOpen, Calendar, AlertCircle, Truck, RefreshCw, Clock, Zap, BarChart2,
  TrendingUp, ArrowRight
} from 'lucide-react';
import { cases, truckRolls } from '../data/sampleData';
import { PriorityBadge, StatusBadge } from '../components/Badge';

const TODAY = '2026-06-15';

function isOverdue(followUp: string) {
  return followUp && followUp < TODAY;
}
function isDueToday(followUp: string) {
  return followUp === TODAY;
}

export default function Dashboard() {
  const openCases = cases.filter(c => c.status !== 'Closed' && c.status !== 'Resolved');
  const dueToday = cases.filter(c => isDueToday(c.nextFollowUp));
  const overdueFollowUps = cases.filter(c => isOverdue(c.nextFollowUp));
  const truckRollsScheduled = truckRolls.filter(t => t.status === 'Scheduled').length;
  const revisitRequired = cases.filter(c => c.status === 'Revisit Required').length;
  const waitingInternal = cases.filter(c => c.status === 'Waiting on Internal Team').length;
  const highPriority = cases.filter(c => (c.priority === 'High' || c.priority === 'Urgent') && c.status !== 'Closed' && c.status !== 'Resolved').length;

  const totalDays = openCases.reduce((sum, c) => {
    const diff = Math.floor((new Date(TODAY).getTime() - new Date(c.dateOpened).getTime()) / 86400000);
    return sum + diff;
  }, 0);
  const avgDaysOpen = openCases.length ? Math.round(totalDays / openCases.length) : 0;

  const metrics = [
    { label: 'Open Cases', value: openCases.length, icon: FolderOpen, color: 'bg-blue-500', link: '/cases' },
    { label: 'Due Today', value: dueToday.length, icon: Calendar, color: 'bg-amber-500', link: '/follow-up' },
    { label: 'Overdue Follow-Ups', value: overdueFollowUps.length, icon: AlertCircle, color: 'bg-red-500', link: '/follow-up' },
    { label: 'Truck Rolls Scheduled', value: truckRollsScheduled, icon: Truck, color: 'bg-indigo-500', link: '/truck-roll' },
    { label: 'Revisit Required', value: revisitRequired, icon: RefreshCw, color: 'bg-orange-500', link: '/truck-roll' },
    { label: 'Waiting on Internal Team', value: waitingInternal, icon: Clock, color: 'bg-yellow-500', link: '/internal-waiting' },
    { label: 'High Priority Cases', value: highPriority, icon: Zap, color: 'bg-red-600', link: '/cases?filter=highpriority' },
    { label: 'Avg Days Open', value: avgDaysOpen, icon: BarChart2, color: 'bg-teal-500', link: '/cases' },
  ];

  const recentCases = [...openCases]
    .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
    .slice(0, 5);

  const urgentCases = openCases.filter(c => c.priority === 'Urgent' || c.priority === 'High').slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Command Center Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Monday, June 15, 2026 — Good morning, Sarah</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
            <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{value}</div>
              <div className="text-xs text-slate-500 leading-tight">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Recent Case Activity</h2>
            </div>
            <Link to="/cases" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentCases.map(c => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">{c.customerName}</div>
                  <div className="text-xs text-slate-500">{c.caseType} · Updated {c.lastUpdate}</div>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* High Priority Cases */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-800 text-sm">High Priority Cases</h2>
            </div>
            <Link to="/escalation" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Escalations <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {urgentCases.map(c => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">{c.customerName}</div>
                  <div className="text-xs text-slate-500">{c.id} · {c.caseType}</div>
                </div>
                <PriorityBadge priority={c.priority} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Due Today */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-amber-500" />
            <h2 className="font-semibold text-slate-800 text-sm">Due Today — {dueToday.length} Follow-Ups</h2>
          </div>
          <Link to="/follow-up" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Follow-Up Center <ArrowRight size={12} />
          </Link>
        </div>
        {dueToday.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-400">No follow-ups due today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-2 text-xs font-semibold text-slate-500">Customer</th>
                  <th className="px-5 py-2 text-xs font-semibold text-slate-500">Case Type</th>
                  <th className="px-5 py-2 text-xs font-semibold text-slate-500">Priority</th>
                  <th className="px-5 py-2 text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-5 py-2 text-xs font-semibold text-slate-500">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dueToday.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link to={`/cases/${c.id}`} className="font-medium text-blue-600 hover:underline">{c.customerName}</Link>
                      <div className="text-xs text-slate-400">{c.id}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.caseType}</td>
                    <td className="px-5 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3 text-slate-600">{c.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
