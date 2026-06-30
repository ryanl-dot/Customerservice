import { Link } from 'react-router-dom';
import {
  FolderOpen, Calendar, AlertCircle, Truck, RefreshCw, Clock,
  Zap, BarChart2, TrendingUp, ArrowRight, ClipboardCheck,
  Users, ShieldAlert, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { cases, truckRolls } from '../data/sampleData';
import {
  truckRollRecords,
  trIsOpen, trIsOverdue, trIsCritical, trCompletedThisMonth, hasActiveRMA,
} from '../data/truckRollData';
import { PriorityBadge, StatusBadge, RiskBadge } from '../components/Badge';
import {
  buildDailySummary, computeRisk, isDueToday,
  daysOpen, daysSinceLastUpdate,
} from '../utils/caseLogic';
import { computeAllKPIs } from '../utils/kpiCalculations';

export default function Dashboard() {
  const kpi = computeAllKPIs(cases, truckRolls);
  const summary = buildDailySummary(cases, truckRolls);

  // TR summary from new operational dataset
  const trs = truckRollRecords;
  const trOpen           = trs.filter(trIsOpen);
  const trNeedsSched     = trOpen.filter(t => t.status === 'Awaiting Customer Scheduling' || t.status === 'New' || t.status === 'Customer Contact Required');
  const trScheduled      = trOpen.filter(t => t.status === 'Scheduled');
  const trAwaitParts     = trOpen.filter(t => t.status === 'Awaiting Parts');
  const trActiveRMA      = trs.filter(hasActiveRMA);
  const trRevisit        = trOpen.filter(t => t.status === 'Return Visit Required' || t.status === 'Revisit Scheduled');
  const trOverdue        = trs.filter(trIsOverdue);
  const trCritical       = trs.filter(trIsCritical);
  const trCompletedMo    = trs.filter(trCompletedThisMonth);

  const openCases = cases.filter(c => c.status !== 'Closed' && c.status !== 'Resolved');

  const topMetrics = [
    { label: 'Open Cases',           value: kpi.openCount,              icon: FolderOpen,  color: 'text-blue-600',    bg: 'bg-blue-50',    link: '/cases' },
    { label: 'Due Today',             value: kpi.dueTodayCount,          icon: Calendar,    color: 'text-amber-600',   bg: 'bg-amber-50',   link: '/follow-up' },
    { label: 'Overdue',               value: kpi.overdueCount,           icon: AlertCircle, color: 'text-red-600',     bg: 'bg-red-50',     link: '/follow-up' },
    { label: 'Truck Rolls Scheduled', value: kpi.trScheduledCount,       icon: Truck,       color: 'text-indigo-600',  bg: 'bg-indigo-50',  link: '/truck-roll' },
    { label: 'Revisit Required',      value: kpi.trInRevisitStatusCount, icon: RefreshCw,   color: 'text-orange-600',  bg: 'bg-orange-50',  link: '/truck-roll' },
    { label: 'Waiting on Internal',   value: kpi.waitingInternalCount,   icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50',   link: '/internal-waiting' },
    { label: 'High Priority',         value: kpi.highPriorityCount,      icon: Zap,         color: 'text-red-600',     bg: 'bg-red-50',     link: '/cases' },
    { label: 'Avg Days Open',         value: kpi.avgDaysOpen,            icon: BarChart2,   color: 'text-teal-600',    bg: 'bg-teal-50',    link: '/cases' },
  ];

  const rankedByRisk = openCases
    .map(c => ({ c, risk: computeRisk(c, truckRolls.find(t => t.id === c.truckRollId)) }))
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, 6);

  const recentCases = [...openCases]
    .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
    .slice(0, 6);

  const dueTodayCases = cases.filter(isDueToday);

  return (
    <div className="space-y-5 max-w-[1400px]">

      {import.meta.env.DEV && (
        <span className="inline-flex items-center text-[10px] font-semibold bg-amber-100 text-amber-700 ring-1 ring-amber-300 px-2 py-0.5 rounded-md">Development Environment</span>
      )}

      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Customer Service Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">My Workload — Sarah Mitchell · Monday, June 15, 2026</p>
        </div>
        <div className="flex items-center gap-2">
          {summary.criticalRisk > 0 && (
            <Link to="/escalation" className="flex items-center gap-1.5 text-xs bg-red-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-red-700 transition-colors">
              <AlertTriangle size={12} />
              {summary.criticalRisk} Critical
            </Link>
          )}
          {summary.escalationsOpen > 0 && (
            <Link to="/escalation" className="flex items-center gap-1.5 text-xs bg-orange-500 text-white px-3 py-1.5 rounded-md font-medium hover:bg-orange-600 transition-colors">
              <ShieldAlert size={12} />
              {summary.escalationsOpen} Escalations
            </Link>
          )}
        </div>
      </div>

      {/* ── Metric cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 xl:grid-cols-8 gap-3">
        {topMetrics.map(({ label, value, icon: Icon, color, bg, link }) => (
          <Link
            key={label}
            to={link}
            className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 hover:shadow-sm transition-all group"
          >
            <div className={`w-8 h-8 ${bg} rounded-md flex items-center justify-center mb-2`}>
              <Icon size={15} className={color} />
            </div>
            <div className={`text-xl font-bold ${value > 0 && (label === 'Overdue' || label === 'High Priority') ? 'text-red-600' : 'text-slate-800'}`}>
              {value}
            </div>
            <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      {/* ── Daily CS Summary ───────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Daily CS Summary</span>
          <span className="ml-auto text-[10px] text-slate-600">Jun 15, 2026 · Auto-calculated</span>
        </div>
        <div className="grid grid-cols-4 xl:grid-cols-8">
          {[
            { label: 'Open Cases',         value: summary.totalOpen,                  icon: FolderOpen,      alert: false },
            { label: 'Overdue',            value: summary.overdueCases,               icon: AlertCircle,     alert: summary.overdueCases > 0 },
            { label: 'Due Today',          value: summary.dueToday,                   icon: Calendar,        alert: summary.dueToday > 0 },
            { label: 'TR Today',           value: summary.truckRollsToday,            icon: Truck,           alert: false },
            { label: 'Missing Outcomes',   value: summary.missingTruckRollOutcomes,   icon: ClipboardCheck,  alert: summary.missingTruckRollOutcomes > 0 },
            { label: 'Need Cust. Update',  value: summary.customersNeedingUpdate,     icon: Users,           alert: summary.customersNeedingUpdate > 0 },
            { label: 'Escalations',        value: summary.escalationsOpen,            icon: ShieldAlert,     alert: summary.escalationsOpen > 0 },
            { label: 'Critical Risk',      value: summary.criticalRisk,               icon: AlertTriangle,   alert: summary.criticalRisk > 0 },
          ].map(({ label, value, icon: Icon, alert }) => (
            <div key={label} className="flex items-center gap-2.5 px-4 py-3 border-r border-slate-800 last:border-r-0">
              <Icon size={14} className={alert && value > 0 ? 'text-red-400' : 'text-slate-600'} />
              <div>
                <div className={`text-lg font-bold leading-none ${alert && value > 0 ? 'text-red-400' : 'text-white'}`}>{value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{label}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Narrative */}
        {(summary.overdueCases > 0 || summary.criticalRisk > 0 || summary.missingTruckRollOutcomes > 0 || summary.customersNeedingUpdate > 0) && (
          <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/30">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {summary.criticalRisk > 0 && <span className="text-red-400 font-medium">🔴 {summary.criticalRisk} critical-risk case{summary.criticalRisk > 1 ? 's' : ''} need immediate attention. </span>}
              {summary.overdueCases > 0 && <span className="text-orange-400">⚠ {summary.overdueCases} overdue follow-up{summary.overdueCases > 1 ? 's' : ''}. </span>}
              {summary.missingTruckRollOutcomes > 0 && <span className="text-yellow-400">📋 {summary.missingTruckRollOutcomes} truck roll outcome{summary.missingTruckRollOutcomes > 1 ? 's' : ''} not filed. </span>}
              {summary.customersNeedingUpdate > 0 && <span className="text-yellow-400">👤 {summary.customersNeedingUpdate} customer{summary.customersNeedingUpdate > 1 ? 's' : ''} not updated after truck roll.</span>}
            </p>
          </div>
        )}
      </div>

      {/* ── Truck Roll Summary ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Truck Roll Summary</span>
            {trCritical.length > 0 && (
              <span className="text-[10px] font-semibold text-red-700 bg-red-50 ring-1 ring-red-200 px-1.5 py-0.5 rounded-md">{trCritical.length} Critical</span>
            )}
          </div>
          <Link to="/truck-roll" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">Truck Roll Center <ArrowRight size={11} /></Link>
        </div>
        <div className="grid grid-cols-4 xl:grid-cols-8 divide-x divide-slate-100">
          {[
            { label: 'Total Open',         value: trOpen.length,        link: '/truck-roll?tab=all',            alert: false },
            { label: 'Needs Scheduling',   value: trNeedsSched.length,  link: '/truck-roll?tab=scheduling',     alert: trNeedsSched.length > 0 },
            { label: 'Scheduled',          value: trScheduled.length,   link: '/truck-roll?tab=scheduling',     alert: false },
            { label: 'Awaiting Parts',     value: trAwaitParts.length,  link: '/truck-roll?tab=scheduling',     alert: trAwaitParts.length > 0 },
            { label: 'Active RMAs',        value: trActiveRMA.length,   link: '/truck-roll?tab=enphase',        alert: false },
            { label: 'Revisit Required',   value: trRevisit.length,     link: '/truck-roll?tab=all',            alert: trRevisit.length > 0 },
            { label: 'Overdue',            value: trOverdue.length,     link: '/truck-roll?tab=overview',       alert: trOverdue.length > 0 },
            { label: 'Completed (Jun)',    value: trCompletedMo.length, link: '/truck-roll?tab=completed',      alert: false },
          ].map(({ label, value, link, alert }) => (
            <Link key={label} to={link} className="flex flex-col px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className={`text-xl font-bold ${alert && value > 0 ? 'text-orange-600' : 'text-slate-800'}`}>{value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Two-column section ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Risk-ranked cases */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Cases by Risk Score</span>
            </div>
            <Link to="/cases" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">All <ArrowRight size={11} /></Link>
          </div>
          <div className="divide-y divide-slate-50">
            {rankedByRisk.map(({ c, risk }) => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{c.customerName}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{c.id} · {c.caseType}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PriorityBadge priority={c.priority} />
                  <RiskBadge level={risk.level} score={risk.score} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Recent Activity</span>
            </div>
            <Link to="/cases" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">All <ArrowRight size={11} /></Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentCases.map(c => {
              const since = daysSinceLastUpdate(c);
              return (
                <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{c.customerName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {c.caseType} · {since === 0 ? 'Updated today' : `${since}d ago`}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Due Today ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-amber-500" />
            <span className="text-sm font-semibold text-slate-700">
              Due Today
              {summary.dueToday > 0
                ? <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 ring-1 ring-amber-200 px-1.5 py-0.5 rounded-md">{summary.dueToday} case{summary.dueToday > 1 ? 's' : ''}</span>
                : null}
            </span>
          </div>
          <Link to="/follow-up" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">Follow-Up Center <ArrowRight size={11} /></Link>
        </div>

        {dueTodayCases.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-4 text-sm text-emerald-600">
            <CheckCircle2 size={15} />
            All caught up — no follow-ups due today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs table-sticky">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Customer', 'Case Type', 'Priority', 'Risk', 'Status', 'Owner', 'Days Open'].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dueTodayCases.map(c => {
                  const risk = computeRisk(c, truckRolls.find(t => t.id === c.truckRollId));
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <Link to={`/cases/${c.id}`} className="font-medium text-blue-600 hover:text-blue-700">{c.customerName}</Link>
                        <div className="text-[10px] text-slate-400">{c.id}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{c.caseType}</td>
                      <td className="px-4 py-2.5"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-4 py-2.5"><RiskBadge level={risk.level} /></td>
                      <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{c.owner}</td>
                      <td className="px-4 py-2.5 text-slate-500">{daysOpen(c)}d</td>
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
