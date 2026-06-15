import { Link } from 'react-router-dom';
import {
  FolderOpen, Calendar, AlertCircle, Truck, RefreshCw, Clock, Zap, BarChart2,
  TrendingUp, ArrowRight, ClipboardCheck, Users, ShieldAlert, Activity,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { cases, truckRolls } from '../data/sampleData';
import { PriorityBadge, StatusBadge, RiskBadge } from '../components/Badge';
import {
  buildDailySummary, computeRisk, isDueToday,
  daysOpen, daysSinceLastUpdate,
} from '../utils/caseLogic';

export default function Dashboard() {
  const openCases = cases.filter(c => c.status !== 'Closed' && c.status !== 'Resolved');
  const summary = buildDailySummary(cases, truckRolls);

  const totalDays = openCases.reduce((sum, c) => sum + daysOpen(c), 0);
  const avgDaysOpen = openCases.length ? Math.round(totalDays / openCases.length) : 0;

  const metrics = [
    { label: 'Open Cases', value: summary.totalOpen, icon: FolderOpen, color: 'bg-blue-500', link: '/cases' },
    { label: 'Due Today', value: summary.dueToday, icon: Calendar, color: 'bg-amber-500', link: '/follow-up' },
    { label: 'Overdue Follow-Ups', value: summary.overdueCases, icon: AlertCircle, color: 'bg-red-500', link: '/follow-up' },
    { label: 'Truck Rolls Scheduled', value: truckRolls.filter(t => t.status === 'Scheduled').length, icon: Truck, color: 'bg-indigo-500', link: '/truck-roll' },
    { label: 'Revisit Required', value: openCases.filter(c => c.status === 'Revisit Required').length, icon: RefreshCw, color: 'bg-orange-500', link: '/truck-roll' },
    { label: 'Waiting on Internal', value: summary.escalationsOpen > 0 ? openCases.filter(c => c.status === 'Waiting on Internal Team').length : 0, icon: Clock, color: 'bg-yellow-500', link: '/internal-waiting' },
    { label: 'High Priority Cases', value: openCases.filter(c => c.priority === 'High' || c.priority === 'Urgent').length, icon: Zap, color: 'bg-red-600', link: '/cases' },
    { label: 'Avg Days Open', value: avgDaysOpen, icon: BarChart2, color: 'bg-teal-500', link: '/cases' },
  ];

  // Recompute waiting on internal correctly
  metrics[5].value = openCases.filter(c => c.status === 'Waiting on Internal Team').length;

  const recentCases = [...openCases]
    .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
    .slice(0, 5);

  // Risk-scored top cases
  const rankedByRisk = openCases
    .map(c => {
      const tr = truckRolls.find(t => t.id === c.truckRollId);
      return { c, risk: computeRisk(c, tr) };
    })
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Command Center Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Monday, June 15, 2026 — Good morning, Sarah</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
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

      {/* ── Daily CS Summary ─────────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700">
          <Activity size={16} className="text-amber-400" />
          <h2 className="font-bold text-white text-sm tracking-wide uppercase">Daily CS Summary — June 15, 2026</h2>
          <span className="ml-auto text-xs text-slate-400">Auto-calculated · Refreshes on load</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y divide-slate-700 md:divide-y-0">
          {[
            { label: 'Total Open Cases', value: summary.totalOpen, icon: FolderOpen, alert: false },
            { label: 'Overdue Cases', value: summary.overdueCases, icon: AlertCircle, alert: summary.overdueCases > 0 },
            { label: 'Due Today', value: summary.dueToday, icon: Calendar, alert: summary.dueToday > 0 },
            { label: 'Truck Rolls Today', value: summary.truckRollsToday, icon: Truck, alert: false },
            { label: 'Missing TR Outcomes', value: summary.missingTruckRollOutcomes, icon: ClipboardCheck, alert: summary.missingTruckRollOutcomes > 0 },
            { label: 'Customers Need Update', value: summary.customersNeedingUpdate, icon: Users, alert: summary.customersNeedingUpdate > 0 },
            { label: 'Open Escalations', value: summary.escalationsOpen, icon: ShieldAlert, alert: summary.escalationsOpen > 0 },
            { label: 'Critical Risk Cases', value: summary.criticalRisk, icon: AlertTriangle, alert: summary.criticalRisk > 0 },
          ].map(({ label, value, icon: Icon, alert }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-4">
              <Icon size={18} className={alert && value > 0 ? 'text-red-400' : 'text-slate-500'} />
              <div>
                <div className={`text-xl font-bold ${alert && value > 0 ? 'text-red-400' : 'text-white'}`}>{value}</div>
                <div className="text-xs text-slate-400 leading-tight">{label}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Narrative */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <p className="text-sm text-slate-300 leading-relaxed">
            {summary.criticalRisk > 0 && (
              <span className="text-red-400 font-semibold">🔴 {summary.criticalRisk} critical-risk case{summary.criticalRisk > 1 ? 's' : ''} require immediate attention. </span>
            )}
            {summary.overdueCases > 0 && (
              <span className="text-orange-400">⚠ {summary.overdueCases} case{summary.overdueCases > 1 ? 's' : ''} are overdue for follow-up. </span>
            )}
            {summary.missingTruckRollOutcomes > 0 && (
              <span className="text-yellow-400">📋 {summary.missingTruckRollOutcomes} truck roll outcome{summary.missingTruckRollOutcomes > 1 ? 's' : ''} not filed. </span>
            )}
            {summary.customersNeedingUpdate > 0 && (
              <span className="text-yellow-400">👤 {summary.customersNeedingUpdate} customer{summary.customersNeedingUpdate > 1 ? 's' : ''} not updated after truck roll. </span>
            )}
            {summary.truckRollsToday > 0 && (
              <span className="text-blue-400">🚚 {summary.truckRollsToday} truck roll{summary.truckRollsToday > 1 ? 's' : ''} scheduled today. </span>
            )}
            {summary.escalationsOpen > 0 && (
              <span className="text-red-400">🚨 {summary.escalationsOpen} active escalation{summary.escalationsOpen > 1 ? 's' : ''} — legal/management review needed.</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk-ranked cases */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Cases by Risk Score</h2>
            </div>
            <Link to="/cases" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              All cases <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {rankedByRisk.map(({ c, risk }) => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">{c.customerName}</div>
                  <div className="text-xs text-slate-500">{c.id} · {c.caseType}</div>
                </div>
                <RiskBadge level={risk.level} score={risk.score} />
              </Link>
            ))}
          </div>
        </div>

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
            {recentCases.map(c => {
              const sinceUpdate = daysSinceLastUpdate(c);
              return (
                <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-800 truncate">{c.customerName}</div>
                    <div className="text-xs text-slate-500">
                      {c.caseType} · Updated {sinceUpdate === 0 ? 'today' : `${sinceUpdate}d ago`}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Due Today */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-amber-500" />
            <h2 className="font-semibold text-slate-800 text-sm">
              Due Today — {summary.dueToday} Follow-Up{summary.dueToday !== 1 ? 's' : ''}
            </h2>
          </div>
          <Link to="/follow-up" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Follow-Up Center <ArrowRight size={12} />
          </Link>
        </div>
        {summary.dueToday === 0 ? (
          <div className="flex items-center gap-3 px-5 py-6 text-sm text-green-600">
            <CheckCircle2 size={16} />
            No follow-ups due today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {['Customer', 'Case Type', 'Priority', 'Risk', 'Status', 'Owner', 'Days Open'].map(h => (
                    <th key={h} className="px-5 py-2 text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cases.filter(c => isDueToday(c)).map(c => {
                  const tr = truckRolls.find(t => t.id === c.truckRollId);
                  const risk = computeRisk(c, tr);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link to={`/cases/${c.id}`} className="font-medium text-blue-600 hover:underline">{c.customerName}</Link>
                        <div className="text-xs text-slate-400">{c.id}</div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{c.caseType}</td>
                      <td className="px-5 py-3"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-5 py-3"><RiskBadge level={risk.level} /></td>
                      <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3 text-slate-600">{c.owner}</td>
                      <td className="px-5 py-3 text-slate-600">{daysOpen(c)}d</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
