import { useState } from 'react';
import { BarChart2, TrendingUp, ShieldAlert, Users, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cases, truckRolls } from '../data/sampleData';
import { computeAllKPIs } from '../utils/kpiCalculations';

const _kpi = computeAllKPIs(cases, truckRolls);
const _ms = _kpi.monthlyScore;

function sc(val: number, goal: number, higher: boolean): 'good'|'warn'|'bad'|'neutral' {
  if (higher ? val >= goal : val <= goal) return 'good';
  if (higher ? val >= goal * 0.9 : val <= goal * 1.1) return 'warn';
  return 'bad';
}

const execKPIs = [
  { label: 'Open Tickets',      value: String(_kpi.openCount),          goal: null,    status: 'neutral' as const },
  { label: 'Due Today',         value: String(_kpi.dueTodayCount),      goal: null,    status: (_kpi.dueTodayCount > 0 ? 'warn' : 'good') as 'warn'|'good' },
  { label: 'Over SLA',          value: String(_kpi.slaBreachedCount),   goal: '0',     status: (_kpi.slaBreachedCount === 0 ? 'good' : 'bad') as 'good'|'bad' },
  { label: 'Avg Resolution',    value: `${_kpi.avgDaysOpen}d`,          goal: '<14d',  status: sc(_kpi.avgDaysOpen, 14, false) },
  { label: 'TR Completion',     value: `${_kpi.trCompletionRate}%`,     goal: '95%',   status: sc(_kpi.trCompletionRate, 95, true) },
  { label: 'TR Revisit Rate',   value: `${_kpi.trRevisitRate}%`,        goal: '<15%',  status: sc(_kpi.trRevisitRate, 15, false) },
  { label: 'GNR Remote Res.',   value: `${_kpi.gnrRemoteRate}%`,        goal: '40%+',  status: sc(_kpi.gnrRemoteRate, 40, true) },
  { label: 'Doc Accuracy',      value: '85%',                            goal: '95%',   status: 'warn' as const },
  { label: 'Follow-Up Comply.', value: `${_kpi.followUpCompliance}%`,   goal: '100%',  status: sc(_kpi.followUpCompliance, 100, true) },
  { label: 'Monthly Score',     value: String(_ms.score),                goal: '90+',   status: sc(_ms.score, 90, true) },
];

function dot(s: string) {
  if (s === 'good') return 'bg-emerald-500';
  if (s === 'warn') return 'bg-amber-500';
  if (s === 'bad')  return 'bg-red-500';
  return 'bg-slate-400';
}
function valueColor(s: string) {
  if (s === 'good') return 'text-emerald-400';
  if (s === 'warn') return 'text-amber-400';
  if (s === 'bad')  return 'text-red-400';
  return 'text-white';
}

export default function ExecutiveDashboard() {
  const [period, setPeriod] = useState('Jun 2026');
  const [rep, setRep] = useState('All Representatives');

  const badItems = execKPIs.filter(m => m.status === 'bad');
  const warnItems = execKPIs.filter(m => m.status === 'warn');
  const goodItems = execKPIs.filter(m => m.status === 'good');

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-800">Executive Dashboard</h1>
            <span className="text-[11px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded-md">Admin Only</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Companywide Executive Metrics — Reporting Period: {period}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-white border border-slate-200 rounded-lg px-4 py-3 items-center">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mr-1">Filters:</span>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400">
          {['Jun 2026','May 2026','Q2 2026'].map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={rep} onChange={e => setRep(e.target.value)} className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400">
          {['All Representatives','Sarah Mitchell','James Rivera','Priya Patel','David Chen','Maria Lopez'].map(r => <option key={r}>{r}</option>)}
        </select>
        <span className="ml-auto text-[10px] text-slate-400">
          {rep === 'All Representatives' ? 'Showing all representatives' : `Filtered: ${rep}`}
        </span>
      </div>

      {/* Dark summary bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Live KPI Summary</span>
          <span className="ml-auto text-[10px] text-slate-600">Jun 15, 2026</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-10">
          {execKPIs.map(m => (
            <div key={m.label} className="px-3 py-3 border-r border-slate-800 last:border-r-0">
              <div className={`text-lg font-bold leading-none ${valueColor(m.status)}`}>{m.value}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{m.label}</div>
              {m.goal && <div className="text-[9px] text-slate-600 mt-0.5">Goal: {m.goal}</div>}
              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${dot(m.status)}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-red-500" />
            <h2 className="text-sm font-semibold text-slate-700">Needs Attention</h2>
          </div>
          <ul className="space-y-2">
            {badItems.length === 0
              ? <li className="text-xs text-slate-400 italic">No critical issues</li>
              : badItems.map(m => (
                <li key={m.label} className="flex items-start gap-2 text-xs text-red-700 bg-red-50 ring-1 ring-red-100 rounded px-2 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5 flex-shrink-0" />
                  {m.label}: {m.value}{m.goal ? ` — goal ${m.goal}` : ''}
                </li>
              ))
            }
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700">Watch Closely</h2>
          </div>
          <ul className="space-y-2">
            {warnItems.length === 0
              ? <li className="text-xs text-slate-400 italic">No warnings</li>
              : warnItems.map(m => (
                <li key={m.label} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 ring-1 ring-amber-100 rounded px-2 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5 flex-shrink-0" />
                  {m.label}: {m.value}{m.goal ? ` — goal ${m.goal}` : ''}
                </li>
              ))
            }
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-700">On Track</h2>
          </div>
          <ul className="space-y-2">
            {goodItems.length === 0
              ? <li className="text-xs text-slate-400 italic">No metrics at goal</li>
              : goodItems.map(m => (
                <li key={m.label} className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100 rounded px-2 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5 flex-shrink-0" />
                  {m.label}: {m.value}{m.goal ? ` — goal ${m.goal}` : ''}
                </li>
              ))
            }
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open Cases',    value: _kpi.openCount,           icon: Users,        color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'High Risk',     value: _kpi.highRiskCount,       icon: ShieldAlert,  color: 'text-red-600',     bg: 'bg-red-50' },
          { label: 'Escalations',   value: _kpi.escalatedCount,      icon: AlertTriangle,color: 'text-orange-600',  bg: 'bg-orange-50' },
          { label: 'Monthly Score', value: _ms.score,                 icon: BarChart2,    color: 'text-indigo-600',  bg: 'bg-indigo-50' },
          { label: 'Avg Days Open', value: `${_kpi.avgDaysOpen}d`,   icon: TrendingUp,   color: 'text-teal-600',    bg: 'bg-teal-50' },
          { label: 'Due Today',     value: _kpi.dueTodayCount,       icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'GNR Remote',    value: `${_kpi.gnrRemoteRate}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'TR Completion', value: `${_kpi.trCompletionRate}%`, icon: TrendingUp, color: _kpi.trCompletionRate >= 95 ? 'text-emerald-600' : 'text-red-600', bg: _kpi.trCompletionRate >= 95 ? 'bg-emerald-50' : 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-3">
            <div className={`w-8 h-8 ${bg} rounded-md flex items-center justify-center mb-2`}>
              <Icon size={14} className={color} />
            </div>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
