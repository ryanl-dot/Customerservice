import { useState } from 'react';
import {
  Clock, CheckCircle2, Truck, Zap, FileCheck,
  Star, RefreshCw, AlertTriangle, DollarSign, TrendingUp,
  ChevronDown, ChevronUp, Award,
} from 'lucide-react';
import { cases, truckRolls } from '../data/sampleData';
import { computeAllKPIs } from '../utils/kpiCalculations';

// ── Compute KPIs from shared source ──────────────────────────────────────────

const MONTHLY = ['Jan','Feb','Mar','Apr','May','Jun'];

const _kpi = computeAllKPIs(cases, truckRolls);

// KPI_SUMMARY uses live computed values where available; historical/doc values remain static.
const KPI_SUMMARY = {
  closureWeek: 14, closureMonth: 46, closureLastMonth: 125,
  resolutionAvg: _kpi.avgDaysOpen,
  agingTotal: _kpi.openCount,
  aging7:  cases.filter(c => { const d = Math.floor((new Date('2026-06-15').getTime() - new Date(c.dateOpened).getTime()) / 86400000); return d >= 7  && c.status !== 'Closed' && c.status !== 'Resolved'; }).length,
  aging14: cases.filter(c => { const d = Math.floor((new Date('2026-06-15').getTime() - new Date(c.dateOpened).getTime()) / 86400000); return d >= 14 && c.status !== 'Closed' && c.status !== 'Resolved'; }).length,
  aging30: cases.filter(c => { const d = Math.floor((new Date('2026-06-15').getTime() - new Date(c.dateOpened).getTime()) / 86400000); return d >= 30 && c.status !== 'Closed' && c.status !== 'Resolved'; }).length,
  followUpPct: _kpi.followUpCompliance,
  followUpRequired: _kpi.openCount,
  followUpCompleted: Math.round(_kpi.openCount * _kpi.followUpCompliance / 100),
  followUpMissed: _kpi.overdueCount,
  followUpOverdue: _kpi.overdueCount,
  prodPct: 89.3, prodTotal: 28, prodResolved: 25, prodEscalated: 3,
  trPct: _kpi.trCompletionRate,
  trScheduled: _kpi.trTotal,
  trCompleted: _kpi.trCompletedCount,
  revisitPct: _kpi.trRevisitRate,
  revisitCount: _kpi.trRevisitFlaggedCount,
  gnrPct: _kpi.gnrRemoteRate,
  gnrTotal: truckRolls.filter(t => t.issueType === 'Gateway Not Reporting').length,
  gnrRemote: truckRolls.filter(t => t.issueType === 'Gateway Not Reporting' && t.couldBeDoneRemotely).length,
  gnrSavings: 1800,
  docPct: 85.0, docAudited: 20, docComplete: 17,
  auditScore: 91, firstResponseAvg: 3.2, firstResponseSla: 87.5,
  reopenPct: 3.2, reopenCount: 4, closedCount: 125,
  escalationPct: Math.round(_kpi.escalatedCount / Math.max(_kpi.openCount, 1) * 1000) / 10,
  escalationCount: _kpi.escalatedCount,
  recoveryPct: 75.0, recoveredAccounts: 9, delinquentAccounts: 12,
  recoveredAmount: 14820,
};

function scoreStatus(val: number, goal: number, higher: boolean): 'good'|'warn'|'bad'|'neutral' {
  if (higher ? val >= goal : val <= goal) return 'good';
  if (higher ? val >= goal * 0.9 : val <= goal * 1.1) return 'warn';
  return 'bad';
}

const _ms = _kpi.monthlyScore;

const MONTHLY_SCORES = [
  { month:'Jan', score:76, grade:'F' },
  { month:'Feb', score:78, grade:'F' },
  { month:'Mar', score:80, grade:'C' },
  { month:'Apr', score:82, grade:'C' },
  { month:'May', score:83, grade:'C' },
  { month:'Jun', score:_ms.score, grade:_ms.grade },
];

const EXEC_METRICS = [
  { label:'Open Tickets',   value:String(_kpi.openCount),                         goal:null,    status:'neutral' as const },
  { label:'Due Today',      value:String(_kpi.dueTodayCount),                      goal:null,    status:(_kpi.dueTodayCount > 0 ? 'warn' : 'good') as 'warn'|'good' },
  { label:'Over SLA',       value:String(_kpi.slaBreachedCount),                   goal:'0',     status:(_kpi.slaBreachedCount === 0 ? 'good' : 'bad') as 'good'|'bad' },
  { label:'Avg Resolution', value:`${_kpi.avgDaysOpen}d`,                          goal:'<14d',  status:scoreStatus(_kpi.avgDaysOpen, 14, false) },
  { label:'TR Completion',  value:`${_kpi.trCompletionRate}%`,                     goal:'95%',   status:scoreStatus(_kpi.trCompletionRate, 95, true) },
  { label:'TR Revisit Rate',value:`${_kpi.trRevisitRate}%`,                        goal:'<15%',  status:scoreStatus(_kpi.trRevisitRate, 15, false) },
  { label:'GNR Remote',     value:`${_kpi.gnrRemoteRate}%`,                        goal:'40%+',  status:scoreStatus(_kpi.gnrRemoteRate, 40, true) },
  { label:'Doc Accuracy',   value:'85%',                                            goal:'95%',   status:'warn' as const },
  { label:'Follow-Up',      value:`${_kpi.followUpCompliance}%`,                   goal:'100%',  status:scoreStatus(_kpi.followUpCompliance, 100, true) },
  { label:'Monthly Score',  value:String(_ms.score),                               goal:'90+',   status:scoreStatus(_ms.score, 90, true) },
];

// ── Tiny inline bar chart ─────────────────────────────────────────────────────

function TinyBar({ values, color = '#3b82f6', goalPct }: { values: number[]; color?: string; goalPct?: number }) {
  const max = Math.max(...values) * 1.1 || 1;
  const w = 200, h = 48, pad = 4;
  const barW = (w - pad * 2) / values.length * 0.65;
  const gap  = (w - pad * 2) / values.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      {values.map((v, i) => {
        const bh = (v / max) * (h - pad * 2);
        const x  = pad + i * gap + (gap - barW) / 2;
        return <rect key={i} x={x} y={h - pad - bh} width={barW} height={bh} fill={color} opacity={i === values.length-1 ? 1 : 0.45} rx="1" />;
      })}
      {goalPct !== undefined && (() => {
        const gy = h - pad - (goalPct / max) * (h - pad * 2);
        return <line x1={pad} y1={gy} x2={w-pad} y2={gy} stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />;
      })()}
    </svg>
  );
}

function TinyLine({ values, color = '#3b82f6', goal }: { values: number[]; color?: string; goal?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, goal ?? 0) * 1.1 || 1;
  const min = Math.min(...values) * 0.9;
  const w = 200, h = 48, pad = 4;
  const iw = w - pad * 2, ih = h - pad * 2;
  const x = (i: number) => pad + (i / (values.length - 1)) * iw;
  const y = (v: number) => pad + ih - ((v - min) / (max - min || 1)) * ih;
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const fill = `M${x(0)},${y(values[0])} ${values.map((v,i)=>`L${x(i)},${y(v)}`).join(' ')} L${x(values.length-1)},${h-pad} L${x(0)},${h-pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <path d={fill} fill={color} fillOpacity={0.1} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {goal !== undefined && (() => {
        const gy = y(goal);
        return gy > pad && gy < h-pad ? <line x1={pad} y1={gy} x2={w-pad} y2={gy} stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" /> : null;
      })()}
      <circle cx={x(values.length-1)} cy={y(values[values.length-1])} r="2.5" fill={color} />
    </svg>
  );
}

function Gauge({ pct, color }: { pct: number; color: string }) {
  const size = 64, r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(Math.max(pct, 0), 100) / 100 * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

// ── Shared UI pieces ──────────────────────────────────────────────────────────

function statusBg(s: string) {
  if (s === 'good') return 'bg-emerald-50 ring-1 ring-emerald-200';
  if (s === 'warn') return 'bg-amber-50 ring-1 ring-amber-200';
  if (s === 'bad')  return 'bg-red-50 ring-1 ring-red-200';
  return 'bg-slate-50 ring-1 ring-slate-200';
}
function statusText(s: string) {
  if (s === 'good') return 'text-emerald-600';
  if (s === 'warn') return 'text-amber-600';
  if (s === 'bad')  return 'text-red-600';
  return 'text-slate-600';
}
function gColor(g: string) {
  if (g === 'A') return '#10b981';
  if (g === 'B') return '#3b82f6';
  if (g === 'C') return '#f59e0b';
  if (g === 'D') return '#f97316';
  return '#ef4444';
}
function gs(val: number, goal: number, higher: boolean, closePct = 0.9) {
  if (higher ? val >= goal : val <= goal) return 'good';
  if (higher ? val >= goal * closePct : val <= goal * (2 - closePct)) return 'warn';
  return 'bad';
}
function pctColor(val: number, goal: number, higher: boolean) {
  const s = gs(val, goal, higher);
  return s === 'good' ? '#10b981' : s === 'warn' ? '#f59e0b' : '#ef4444';
}

function Tile({ label, value, sub, status = 'neutral' }: { label: string; value: string|number; sub?: string; status?: string }) {
  return (
    <div className={`rounded-lg p-3 ${statusBg(status)}`}>
      <div className={`text-xl font-bold ${statusText(status)}`}>{value}</div>
      <div className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function GoalBadge({ passes, label }: { passes: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${passes ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
      {passes ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
      {label}
    </span>
  );
}

function KPICard({ title, icon: Icon, accent, children }: {
  title: string; icon: React.ElementType; accent: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center gap-2 px-4 py-2.5 border-b text-left ${accent}`}>
        <Icon size={14} />
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto">{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KPICenter() {
  const [period, setPeriod] = useState('Jun 2026');
  const [rep, setRep] = useState('All Representatives');
  const [caseType, setCaseType] = useState('All Types');
  const latestScore = MONTHLY_SCORES[MONTHLY_SCORES.length - 1];

  return (
    <div className="space-y-4 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-800">Admin KPI Center</h1>
            <span className="text-[11px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded-md">Admin Only</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Teamwide Customer Service Metrics — Reporting Period: {period}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ring-1`} style={{ color: gColor(latestScore.grade), backgroundColor: gColor(latestScore.grade) + '18', outlineColor: gColor(latestScore.grade) + '40' }}>
          {period} Score: {latestScore.score} — {latestScore.grade}
        </span>
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
        <select value={caseType} onChange={e => setCaseType(e.target.value)} className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400">
          {['All Types','GNR','Truck Roll','Billing','Technical'].map(t => <option key={t}>{t}</option>)}
        </select>
        {(rep !== 'All Representatives' || caseType !== 'All Types') && (
          <span className="text-[10px] text-amber-700 bg-amber-50 ring-1 ring-amber-200 px-2 py-0.5 rounded-md font-medium">Filtered view — data scoped above</span>
        )}
        {rep === 'All Representatives' && caseType === 'All Types' && (
          <span className="ml-auto text-[10px] text-slate-400">Showing all representatives · all case types</span>
        )}
      </div>

      {/* ── Executive Dashboard bar ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Executive Dashboard</span>
          <span className="ml-auto text-[10px] text-slate-600">Jun 15, 2026</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-10">
          {EXEC_METRICS.map(m => (
            <div key={m.label} className="px-3 py-3 border-r border-slate-800 last:border-r-0">
              <div className={`text-base font-bold leading-none ${m.status === 'good' ? 'text-emerald-400' : m.status === 'bad' ? 'text-red-400' : m.status === 'warn' ? 'text-amber-400' : 'text-white'}`}>{m.value}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{m.label}</div>
              {m.goal && <div className="text-[9px] text-slate-600 mt-0.5">Goal: {m.goal}</div>}
              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${m.status === 'good' ? 'bg-emerald-500' : m.status === 'bad' ? 'bg-red-500' : m.status === 'warn' ? 'bg-amber-500' : 'bg-slate-600'}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest pt-1">Ticket Management KPIs</div>

      {/* 1. Ticket Closure Rate */}
      <KPICard title="1 · Ticket Closure Rate" icon={CheckCircle2} accent="bg-sky-50 border-sky-100 text-sky-800">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Tile label="Closed This Week"  value={KPI_SUMMARY.closureWeek}      status="neutral" />
          <Tile label="Closed This Month" value={KPI_SUMMARY.closureMonth}     sub="Jun (partial)" status="neutral" />
          <Tile label="Closed Last Month" value={KPI_SUMMARY.closureLastMonth} sub="May 2026" status="neutral" />
          <Tile label="MoM Change"        value={`${KPI_SUMMARY.closureMonth > KPI_SUMMARY.closureLastMonth ? '+' : ''}${KPI_SUMMARY.closureMonth - KPI_SUMMARY.closureLastMonth}`} status={KPI_SUMMARY.closureMonth >= KPI_SUMMARY.closureLastMonth ? 'good' : 'bad'} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Monthly Closures (YTD)</p>
            <TinyBar values={[84,81,100,113,125,46]} color="#0ea5e9" />
            <div className="flex justify-between mt-0.5">{MONTHLY.map(m => <span key={m} className="text-[9px] text-slate-400">{m}</span>)}</div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Weekly Trend (last 8 weeks)</p>
            <TinyBar values={[29,33,28,35,32,14,0,0].slice(0,6)} color="#0ea5e9" />
          </div>
        </div>
      </KPICard>

      {/* 2. Average Resolution Time */}
      <KPICard title="2 · Average Resolution Time" icon={Clock} accent="bg-indigo-50 border-indigo-100 text-indigo-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {[
            { type:'Billing',    avg:5.2,  goal:7,  trend:[6.8,7.1,6.2,5.9,5.4,5.2] },
            { type:'Production', avg:16.4, goal:14, trend:[18.2,17.8,17.1,16.9,16.7,16.4] },
            { type:'Truck Roll', avg:19.1, goal:21, trend:[24.3,23.1,21.8,20.9,19.8,19.1] },
          ].map(r => {
            const passes = r.avg <= r.goal;
            const s = gs(r.avg, r.goal, false);
            return (
              <div key={r.type} className={`rounded-lg p-3 border ${s==='good'?'border-emerald-200 bg-emerald-50':s==='warn'?'border-amber-200 bg-amber-50':'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">{r.type}</span>
                  <GoalBadge passes={passes} label={`≤${r.goal}d`} />
                </div>
                <div className={`text-2xl font-bold ${statusText(s)}`}>{r.avg}d</div>
                <TinyLine values={r.trend} color={pctColor(r.avg, r.goal, false)} goal={r.goal} />
                <div className="flex justify-between mt-0.5">{MONTHLY.map(m=><span key={m} className="text-[9px] text-slate-400">{m}</span>)}</div>
              </div>
            );
          })}
        </div>
      </KPICard>

      {/* 3. Aging Ticket % */}
      <KPICard title="3 · Aging Ticket Percentage" icon={AlertTriangle} accent="bg-orange-50 border-orange-100 text-orange-800">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <Tile label="Total Open"  value={KPI_SUMMARY.agingTotal}                                                              status="neutral" />
          <Tile label="Over 7 Days"  value={KPI_SUMMARY.aging7}  sub={`${((KPI_SUMMARY.aging7/KPI_SUMMARY.agingTotal)*100).toFixed(1)}%`} status="warn" />
          <Tile label="Over 14 Days" value={KPI_SUMMARY.aging14} sub={`${((KPI_SUMMARY.aging14/KPI_SUMMARY.agingTotal)*100).toFixed(1)}%`} status="warn" />
          <Tile label="Over 30 Days" value={KPI_SUMMARY.aging30} sub={`${((KPI_SUMMARY.aging30/KPI_SUMMARY.agingTotal)*100).toFixed(1)}%`} status="bad" />
        </div>
        <GoalBadge passes={KPI_SUMMARY.aging30/KPI_SUMMARY.agingTotal*100 <= 10} label={`Goal: <10% over 30d (currently ${(KPI_SUMMARY.aging30/KPI_SUMMARY.agingTotal*100).toFixed(1)}%)`} />
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5">% Over 30d — Monthly Trend</p>
          <TinyLine values={[22.1,20.3,18.7,17.2,15.4,14.3]} color="#f97316" goal={10} />
        </div>
      </KPICard>

      {/* 4. Follow-Up Compliance */}
      <KPICard title="4 · Follow-Up Compliance" icon={CheckCircle2} accent="bg-teal-50 border-teal-100 text-teal-800">
        <div className="flex items-start gap-4 mb-3">
          <div className="relative flex-shrink-0">
            <Gauge pct={KPI_SUMMARY.followUpPct} color={pctColor(KPI_SUMMARY.followUpPct,100,true)} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-800">{KPI_SUMMARY.followUpPct}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            <Tile label="Required"  value={KPI_SUMMARY.followUpRequired}  status="neutral" />
            <Tile label="Completed" value={KPI_SUMMARY.followUpCompleted} status="good" />
            <Tile label="Missed"    value={KPI_SUMMARY.followUpMissed}    status="warn" />
            <Tile label="Overdue"   value={KPI_SUMMARY.followUpOverdue}   status="bad" />
          </div>
        </div>
        <GoalBadge passes={KPI_SUMMARY.followUpPct >= 100} label="Goal: 100%" />
        <div className="mt-3"><TinyLine values={[78.2,80.1,82.4,84.0,85.3,85.7]} color="#0d9488" goal={100} /></div>
      </KPICard>

      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest pt-1">Solar-Specific KPIs</div>

      {/* 5-8 in 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <KPICard title="5 · Production Resolution Rate" icon={Zap} accent="bg-yellow-50 border-yellow-100 text-yellow-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={KPI_SUMMARY.prodPct} color={pctColor(KPI_SUMMARY.prodPct,85,true)} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-800">{KPI_SUMMARY.prodPct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 flex-1">
              <Tile label="Total"    value={KPI_SUMMARY.prodTotal}    status="neutral" />
              <Tile label="Resolved" value={KPI_SUMMARY.prodResolved} status="good" />
              <Tile label="Escalated"value={KPI_SUMMARY.prodEscalated}status="warn" />
            </div>
          </div>
          <GoalBadge passes={KPI_SUMMARY.prodPct >= 85} label="Goal: 85%+" />
          <div className="mt-2"><TinyLine values={[79.1,81.3,83.5,85.7,87.9,89.3]} color="#eab308" goal={85} /></div>
        </KPICard>

        <KPICard title="6 · Truck Roll Completion Rate" icon={Truck} accent="bg-blue-50 border-blue-100 text-blue-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={KPI_SUMMARY.trPct} color={pctColor(KPI_SUMMARY.trPct,95,true)} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-800">{KPI_SUMMARY.trPct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Tile label="Scheduled" value={KPI_SUMMARY.trScheduled} status="neutral" />
              <Tile label="Completed" value={KPI_SUMMARY.trCompleted} status="bad" />
            </div>
          </div>
          <GoalBadge passes={KPI_SUMMARY.trPct >= 95} label="Goal: 95%+" />
          <div className="mt-2"><TinyLine values={[88.2,90.1,92.3,91.7,93.4,60.0]} color="#3b82f6" goal={95} /></div>
        </KPICard>

        <KPICard title="7 · Truck Roll Revisit Rate" icon={RefreshCw} accent="bg-orange-50 border-orange-100 text-orange-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={KPI_SUMMARY.revisitPct} color={pctColor(KPI_SUMMARY.revisitPct,15,false)} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-800">{KPI_SUMMARY.revisitPct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Tile label="Completed TRs"   value={KPI_SUMMARY.trCompleted}   status="neutral" />
              <Tile label="Revisit Required" value={KPI_SUMMARY.revisitCount} status="bad" />
            </div>
          </div>
          <GoalBadge passes={KPI_SUMMARY.revisitPct <= 15} label="Goal: <15%" />
          <div className="mt-2"><TinyLine values={[28.1,25.4,22.1,19.8,18.2,33.3]} color="#f97316" goal={15} /></div>
        </KPICard>

        <KPICard title="8 · GNR Remote Resolution Rate" icon={TrendingUp} accent="bg-emerald-50 border-emerald-100 text-emerald-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={KPI_SUMMARY.gnrPct} color={pctColor(KPI_SUMMARY.gnrPct,40,true)} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-800">{KPI_SUMMARY.gnrPct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Tile label="Total GNR"      value={KPI_SUMMARY.gnrTotal}  status="neutral" />
              <Tile label="Remote Resolved"value={KPI_SUMMARY.gnrRemote} status="good" />
              <Tile label="TRs Avoided"    value={KPI_SUMMARY.gnrRemote} status="good" />
              <Tile label="Est. Savings"   value={`$${KPI_SUMMARY.gnrSavings.toLocaleString()}`} status="good" />
            </div>
          </div>
          <GoalBadge passes={KPI_SUMMARY.gnrPct >= 40} label="Goal: 40%+" />
          <div className="mt-2"><TinyLine values={[32.4,35.1,38.7,41.2,46.3,50.0]} color="#10b981" goal={40} /></div>
        </KPICard>

      </div>

      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest pt-1">Quality KPIs</div>

      {/* 9-10 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <KPICard title="9 · Documentation Accuracy" icon={FileCheck} accent="bg-purple-50 border-purple-100 text-purple-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={KPI_SUMMARY.docPct} color={pctColor(KPI_SUMMARY.docPct,95,true)} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-800">{KPI_SUMMARY.docPct}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Tile label="Audited"  value={KPI_SUMMARY.docAudited}  status="neutral" />
                <Tile label="Complete" value={KPI_SUMMARY.docComplete} status="warn" />
              </div>
              <div className="space-y-1">
                {[['Customer Concern',1],['Root Cause',2],['Next Steps',0],['Follow-Up Date',3]].map(([f,c]) => (
                  <div key={f as string} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{f}</span>
                    <span className={`font-semibold ${(c as number) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{c} missing</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <GoalBadge passes={KPI_SUMMARY.docPct >= 95} label="Goal: 95%+" />
          <div className="mt-2"><TinyLine values={[72.1,75.4,78.9,81.2,83.7,85.0]} color="#8b5cf6" goal={95} /></div>
        </KPICard>

        <KPICard title="10 · Ticket Audit Score" icon={Star} accent="bg-rose-50 border-rose-100 text-rose-800">
          <div className="flex items-center gap-4 mb-3">
            <div className="text-4xl font-bold text-slate-800">{KPI_SUMMARY.auditScore}</div>
            <div>
              <GoalBadge passes={KPI_SUMMARY.auditScore >= 90} label="Goal: 90+" />
              <div className="text-[10px] text-slate-400 mt-1">June 2026 composite</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[['Accuracy',90],['Professionalism',96],['Follow-Up',88],['Resolution',89]].map(([l,v]) => (
              <div key={l as string} className={`rounded-lg p-2 ${statusBg(gs(v as number,90,true))}`}>
                <div className={`text-lg font-bold ${statusText(gs(v as number,90,true))}`}>{v}</div>
                <div className="text-[10px] text-slate-500">{l}</div>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Monthly Score Trend</p>
            <TinyLine values={[83,85,87,88,90,91]} color="#f43f5e" goal={90} />
          </div>
        </KPICard>

      </div>

      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest pt-1">Additional KPIs</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <KPICard title="11 · First Response Time" icon={Clock} accent="bg-sky-50 border-sky-100 text-sky-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={KPI_SUMMARY.firstResponseSla} color={pctColor(KPI_SUMMARY.firstResponseSla,90,true)} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-800">{KPI_SUMMARY.firstResponseSla}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Tile label="Avg Response"    value={`${KPI_SUMMARY.firstResponseAvg}h`} status={gs(KPI_SUMMARY.firstResponseAvg,4,false)} />
              <Tile label="SLA Compliance"  value={`${KPI_SUMMARY.firstResponseSla}%`} status={gs(KPI_SUMMARY.firstResponseSla,90,true)} />
            </div>
          </div>
          <GoalBadge passes={KPI_SUMMARY.firstResponseAvg <= 4} label="Goal: <4h" />
          <div className="mt-2"><TinyLine values={[5.8,5.2,4.7,4.1,3.6,3.2]} color="#0ea5e9" goal={4} /></div>
        </KPICard>

        <KPICard title="12 · Ticket Reopen Rate" icon={RefreshCw} accent="bg-amber-50 border-amber-100 text-amber-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={KPI_SUMMARY.reopenPct} color={pctColor(KPI_SUMMARY.reopenPct,5,false)} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-800">{KPI_SUMMARY.reopenPct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Tile label="Closed"   value={KPI_SUMMARY.closedCount} status="neutral" />
              <Tile label="Reopened" value={KPI_SUMMARY.reopenCount} status="good" />
            </div>
          </div>
          <GoalBadge passes={KPI_SUMMARY.reopenPct <= 5} label="Goal: <5%" />
          <div className="mt-2"><TinyLine values={[6.2,5.8,5.1,4.4,3.7,3.2]} color="#f59e0b" goal={5} /></div>
        </KPICard>

        <KPICard title="13 · Escalation Rate" icon={AlertTriangle} accent="bg-red-50 border-red-100 text-red-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={KPI_SUMMARY.escalationPct} color={pctColor(KPI_SUMMARY.escalationPct,5,false)} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-800">{KPI_SUMMARY.escalationPct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Tile label="Total Tickets" value={KPI_SUMMARY.closedCount}      status="neutral" />
              <Tile label="Escalated"     value={KPI_SUMMARY.escalationCount}  status="good" />
            </div>
          </div>
          <GoalBadge passes={KPI_SUMMARY.escalationPct <= 5} label="Goal: <5%" />
          <div className="mt-2"><TinyLine values={[7.2,6.8,5.9,5.3,4.6,4.0]} color="#ef4444" goal={5} /></div>
        </KPICard>

        <KPICard title="14 · Collection Recovery Rate" icon={DollarSign} accent="bg-green-50 border-green-100 text-green-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={KPI_SUMMARY.recoveryPct} color={pctColor(KPI_SUMMARY.recoveryPct,70,true)} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-800">{KPI_SUMMARY.recoveryPct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Tile label="Delinquent"       value={KPI_SUMMARY.delinquentAccounts} status="neutral" />
              <Tile label="Recovered"        value={KPI_SUMMARY.recoveredAccounts}  status="good" />
              <Tile label="Amount Recovered" value={`$${KPI_SUMMARY.recoveredAmount.toLocaleString()}`} status="good" />
              <Tile label="Recovery Rate"    value={`${KPI_SUMMARY.recoveryPct}%`} status="good" />
            </div>
          </div>
          <div className="mt-2"><TinyLine values={[58.3,61.7,65.2,68.4,71.9,75.0]} color="#22c55e" /></div>
        </KPICard>

      </div>

      {/* ── Monthly Scorecard ── */}
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest pt-1">Monthly Scorecard</div>

      <KPICard title="Employee Performance Scorecard" icon={Award} accent="bg-slate-800 border-slate-700 text-white">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label:'Jun Score', score:84, grade:'C' },
            { label:'Q2 Score',  score:83, grade:'C' },
            { label:'YTD Score', score:81, grade:'C' },
          ].map(({ label, score, grade }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-slate-800">{score}</div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full ring-1 text-base font-bold mt-1"
                style={{ color: gColor(grade), backgroundColor: gColor(grade)+'18', outlineColor: gColor(grade) }}>
                {grade}
              </div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">Scorecard Weights</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {[['CSAT','20%'],['Follow-Up Compliance','20%'],['Resolution Time','15%'],['Collection Recovery','15%'],['First Response','10%'],['Doc Accuracy','10%'],['Escalation Rate','5%'],['Reopen Rate','5%']].map(([k,v]) => (
              <div key={k} className="flex justify-between text-xs text-slate-600 bg-white rounded px-2 py-1 border border-slate-200">
                <span>{k}</span><span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Month','CSAT','1st Resp.','Follow-Up','Resolution','Doc','Collections','Escal.','Reopen','Score','Grade'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                {month:'Jun',csat:88,fr:86,fu:86,rt:85,doc:85,col:75,esc:84,ro:82,score:84,grade:'C'},
                {month:'May',csat:86,fr:82,fu:85,rt:82,doc:84,col:72,esc:80,ro:79,score:83,grade:'C'},
                {month:'Apr',csat:82,fr:76,fu:84,rt:78,doc:81,col:68,esc:76,ro:75,score:80,grade:'C'},
                {month:'Mar',csat:79,fr:71,fu:82,rt:75,doc:79,col:65,esc:72,ro:71,score:77,grade:'F'},
                {month:'Feb',csat:76,fr:65,fu:80,rt:72,doc:75,col:62,esc:68,ro:67,score:74,grade:'F'},
                {month:'Jan',csat:74,fr:60,fu:78,rt:70,doc:72,col:58,esc:65,ro:63,score:71,grade:'F'},
              ].map(r => (
                <tr key={r.month} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-700">{r.month}</td>
                  <td className="px-3 py-2 text-slate-600">{r.csat}</td>
                  <td className="px-3 py-2 text-slate-600">{r.fr}</td>
                  <td className="px-3 py-2 text-slate-600">{r.fu}</td>
                  <td className="px-3 py-2 text-slate-600">{r.rt}</td>
                  <td className="px-3 py-2 text-slate-600">{r.doc}</td>
                  <td className="px-3 py-2 text-slate-600">{r.col}</td>
                  <td className="px-3 py-2 text-slate-600">{r.esc}</td>
                  <td className="px-3 py-2 text-slate-600">{r.ro}</td>
                  <td className="px-3 py-2 font-bold text-slate-800">{r.score}</td>
                  <td className="px-3 py-2">
                    <span className="font-bold text-sm px-1.5 py-0.5 rounded ring-1" style={{ color: gColor(r.grade), backgroundColor: gColor(r.grade)+'18' }}>{r.grade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Monthly Score Trend</p>
          <TinyBar values={MONTHLY_SCORES.map(s => s.score)} color="#6366f1" />
          <div className="flex justify-between mt-0.5">{MONTHLY.map(m => <span key={m} className="text-[9px] text-slate-400">{m}</span>)}</div>
        </div>
      </KPICard>

    </div>
  );
}
