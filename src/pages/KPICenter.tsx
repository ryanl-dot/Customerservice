import { useState } from 'react';
import {
  ShieldCheck, Clock, CheckCircle2, Truck, Zap, FileCheck,
  Star, RefreshCw, AlertTriangle, DollarSign, TrendingUp,
  ChevronDown, ChevronUp, Award,
} from 'lucide-react';
import {
  closureWeekly, closureMonthly, ticketClosureSummary,
  resolutionByType, resolutionOverall,
  agingStats, agingTrend,
  followUpCompliance, followUpTrend,
  productionResolution, productionTrend,
  truckRollCompletion, truckRollCompletionTrend,
  truckRollRevisit, revisitTrend,
  gnrResolution, gnrTrend,
  docAccuracy, docAccuracyHistory,
  auditScores,
  firstResponse, firstResponseTrend,
  reopenRate, reopenTrend,
  escalationRate, escalationTrend,
  collectionRecovery, collectionTrend,
  scorecard, quarterlyScore, annualScore,
  execMetrics,
} from '../data/kpiData';
import { LineChart, BarChart, Gauge } from '../components/MiniChart';

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  if (status === 'good')    return 'text-emerald-600';
  if (status === 'warn')    return 'text-amber-600';
  if (status === 'bad')     return 'text-red-600';
  return 'text-slate-600';
}

function statusBg(status: string) {
  if (status === 'good')    return 'bg-emerald-50 ring-1 ring-emerald-200';
  if (status === 'warn')    return 'bg-amber-50 ring-1 ring-amber-200';
  if (status === 'bad')     return 'bg-red-50 ring-1 ring-red-200';
  return 'bg-slate-50 ring-1 ring-slate-200';
}

function goalStatus(val: number, goal: number, higherIsBetter: boolean) {
  const ok = higherIsBetter ? val >= goal : val <= goal;
  const close = higherIsBetter
    ? val >= goal * 0.9 && val < goal
    : val > goal && val <= goal * 1.15;
  return ok ? 'good' : close ? 'warn' : 'bad';
}

function pctColor(val: number, goal: number, higherIsBetter: boolean) {
  const s = goalStatus(val, goal, higherIsBetter);
  return s === 'good' ? '#10b981' : s === 'warn' ? '#f59e0b' : '#ef4444';
}

function gradeColor(g: string) {
  if (g === 'A') return 'text-emerald-600 bg-emerald-50 ring-emerald-200';
  if (g === 'B') return 'text-blue-600 bg-blue-50 ring-blue-200';
  if (g === 'C') return 'text-amber-600 bg-amber-50 ring-amber-200';
  if (g === 'D') return 'text-orange-600 bg-orange-50 ring-orange-200';
  return 'text-red-600 bg-red-50 ring-red-200';
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({ id, title, icon: Icon, accent, children }: {
  id: string; title: string; icon: React.ElementType;
  accent: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div id={id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 border-b text-left ${accent}`}
      >
        <Icon size={14} />
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto">{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// ── Stat tile ────────────────────────────────────────────────────────────────

function Tile({ label, value, sub, status = 'neutral' }: {
  label: string; value: string | number; sub?: string; status?: string;
}) {
  return (
    <div className={`rounded-lg p-3 ${statusBg(status)}`}>
      <div className={`text-xl font-bold ${statusColor(status)}`}>{value}</div>
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

// ── KPI Center ───────────────────────────────────────────────────────────────

export default function KPICenter() {
  const latestAudit = auditScores[auditScores.length - 1];
  const latestScore = scorecard[scorecard.length - 1];

  return (
    <div className="space-y-4 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-800">KPI Center</h1>
            <span className="flex items-center gap-1 text-[11px] font-medium bg-red-600 text-white px-2 py-0.5 rounded-md">
              <ShieldCheck size={10} /> Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">June 2026 — All KPIs calculated from case data. Mock trend data shown.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ring-1 ${gradeColor(latestScore.grade)}`}>
            Jun Score: {latestScore.weighted} — {latestScore.grade}
          </span>
        </div>
      </div>

      {/* ── Executive Dashboard ────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Executive Dashboard</span>
          <span className="ml-auto text-[10px] text-slate-600">Jun 15, 2026</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-10">
          {execMetrics.map(m => (
            <div key={m.label} className="flex flex-col gap-0.5 px-3 py-3 border-r border-slate-800 last:border-r-0">
              <div className={`text-base font-bold leading-none ${m.status === 'good' ? 'text-emerald-400' : m.status === 'warn' ? 'text-amber-400' : m.status === 'bad' ? 'text-red-400' : 'text-white'}`}>
                {m.value}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">{m.label}</div>
              {m.goal && (
                <div className="text-[9px] text-slate-600">Goal: {m.goal}</div>
              )}
              <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${m.status === 'good' ? 'bg-emerald-500' : m.status === 'warn' ? 'bg-amber-500' : m.status === 'bad' ? 'bg-red-500' : 'bg-slate-600'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* ─── TICKET MANAGEMENT ─────────────────────────────────────────────── */}
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest pt-1">Ticket Management KPIs</div>

      {/* 1. Ticket Closure Rate */}
      <Section id="closure" title="1 · Ticket Closure Rate" icon={CheckCircle2} accent="bg-sky-50 border-sky-100 text-sky-800">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Tile label="Closed This Week"   value={ticketClosureSummary.weeklyClosedThisWeek}  sub="Week of Jun 15" status="neutral" />
          <Tile label="Closed Last Week"   value={ticketClosureSummary.weeklyClosedLastWeek}   sub="Week of Jun 8" status="neutral" />
          <Tile label="Closed This Month"  value={ticketClosureSummary.monthlyClosedThisMonth} sub="June 2026 (partial)" status="neutral" />
          <Tile label="Closed Last Month"  value={ticketClosureSummary.monthlyClosedLastMonth} sub="May 2026" status="neutral" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Weekly Closures (last 22 weeks)</p>
            <BarChart data={closureWeekly} labels={closureWeekly.map((_, i) => i % 4 === 0 ? closureWeekly[i].week.replace(' W1','') : '')} height={72} color="#0ea5e9" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Monthly Closures (YTD)</p>
            <BarChart data={closureMonthly} labels={closureMonthly.map(d => d.month)} height={72} color="#0ea5e9" />
          </div>
        </div>
      </Section>

      {/* 2. Average Resolution Time */}
      <Section id="resolution" title="2 · Average Resolution Time" icon={Clock} accent="bg-indigo-50 border-indigo-100 text-indigo-800">
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Overall avg:</span>
          <span className="font-bold text-slate-800">{resolutionOverall[resolutionOverall.length-1].value}d</span>
          <GoalBadge passes={resolutionOverall[resolutionOverall.length-1].value <= 14} label="Goal < 14d" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {resolutionByType.map(r => {
            const passes = r.avgDays <= r.goalDays;
            const s = goalStatus(r.avgDays, r.goalDays, false);
            return (
              <div key={r.type} className={`rounded-lg p-3 border ${s === 'good' ? 'border-emerald-200 bg-emerald-50' : s === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">{r.type}</span>
                  <GoalBadge passes={passes} label={`Goal ≤${r.goalDays}d`} />
                </div>
                <div className={`text-2xl font-bold ${statusColor(s)}`}>{r.avgDays}d</div>
                <div className="mt-2">
                  <LineChart data={r.trend} height={40} color={pctColor(r.avgDays, r.goalDays, false)} goalValue={r.goalDays} />
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Overall Avg Resolution Time Trend</p>
          <LineChart data={resolutionOverall} height={52} color="#6366f1" goalValue={14} showDots />
        </div>
      </Section>

      {/* 3. Aging Ticket Percentage */}
      <Section id="aging" title="3 · Aging Ticket Percentage" icon={AlertTriangle} accent="bg-orange-50 border-orange-100 text-orange-800">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Tile label="Total Open" value={agingStats.totalOpen} status="neutral" />
          <Tile label="Over 7 Days"  value={agingStats.over7Days.count}  sub={`${agingStats.over7Days.pct}%`}  status={goalStatus(agingStats.over7Days.pct, 50, false)} />
          <Tile label="Over 14 Days" value={agingStats.over14Days.count} sub={`${agingStats.over14Days.pct}%`} status={goalStatus(agingStats.over14Days.pct, 25, false)} />
          <Tile label="Over 30 Days" value={agingStats.over30Days.count} sub={`${agingStats.over30Days.pct}%`} status={goalStatus(agingStats.over30Days.pct, agingStats.goal30DayPct, false)} />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <GoalBadge passes={agingStats.over30Days.pct <= agingStats.goal30DayPct} label={`Goal: <${agingStats.goal30DayPct}% over 30d (currently ${agingStats.over30Days.pct}%)`} />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5">% Over 30 Days — Monthly Trend</p>
          <LineChart data={agingTrend} height={52} color="#f97316" goalValue={10} />
        </div>
      </Section>

      {/* 4. Follow-Up Compliance */}
      <Section id="followup" title="4 · Follow-Up Compliance" icon={CheckCircle2} accent="bg-teal-50 border-teal-100 text-teal-800">
        <div className="flex items-start gap-6 mb-4">
          <div className="relative flex-shrink-0">
            <Gauge pct={followUpCompliance.pct} color={pctColor(followUpCompliance.pct, followUpCompliance.goal, true)} size={72} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-800">{followUpCompliance.pct}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            <Tile label="Required"  value={followUpCompliance.required}  status="neutral" />
            <Tile label="Completed" value={followUpCompliance.completed} status="good" />
            <Tile label="Missed"    value={followUpCompliance.missed}    status={followUpCompliance.missed > 0 ? 'warn' : 'good'} />
            <Tile label="Overdue"   value={followUpCompliance.overdue}   status={followUpCompliance.overdue > 0 ? 'bad' : 'good'} />
          </div>
        </div>
        <GoalBadge passes={followUpCompliance.pct >= followUpCompliance.goal} label={`Goal: ${followUpCompliance.goal}% compliance`} />
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Compliance % Trend</p>
          <LineChart data={followUpTrend} height={48} color="#0d9488" goalValue={100} />
        </div>
      </Section>

      {/* ─── SOLAR-SPECIFIC ─────────────────────────────────────────────────── */}
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest pt-1">Solar-Specific KPIs</div>

      {/* 5. Production Concern Resolution */}
      <Section id="production" title="5 · Production Concern Resolution Rate" icon={Zap} accent="bg-yellow-50 border-yellow-100 text-yellow-800">
        <div className="flex items-start gap-6 mb-4">
          <div className="relative flex-shrink-0">
            <Gauge pct={productionResolution.pct} color={pctColor(productionResolution.pct, productionResolution.goal, true)} size={72} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-800">{productionResolution.pct}%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 flex-1">
            <Tile label="Total Production" value={productionResolution.total}     status="neutral" />
            <Tile label="Resolved"         value={productionResolution.resolved}  status="good" />
            <Tile label="Escalated"        value={productionResolution.escalated} status={productionResolution.escalated > 0 ? 'warn' : 'good'} />
          </div>
        </div>
        <GoalBadge passes={productionResolution.pct >= productionResolution.goal} label={`Goal: ${productionResolution.goal}%+ resolved without escalation`} />
        <div className="mt-3">
          <LineChart data={productionTrend} height={48} color="#eab308" goalValue={85} />
        </div>
      </Section>

      {/* 6. Truck Roll Completion Rate */}
      <Section id="tr-completion" title="6 · Truck Roll Completion Rate" icon={Truck} accent="bg-blue-50 border-blue-100 text-blue-800">
        <div className="flex items-start gap-6 mb-4">
          <div className="relative flex-shrink-0">
            <Gauge pct={truckRollCompletion.pct} color={pctColor(truckRollCompletion.pct, truckRollCompletion.goal, true)} size={72} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-800">{truckRollCompletion.pct}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            <Tile label="Scheduled"  value={truckRollCompletion.scheduled} status="neutral" />
            <Tile label="Completed"  value={truckRollCompletion.completed} status={goalStatus(truckRollCompletion.pct, truckRollCompletion.goal, true)} />
          </div>
        </div>
        <GoalBadge passes={truckRollCompletion.pct >= truckRollCompletion.goal} label={`Goal: ${truckRollCompletion.goal}%+ completion (currently ${truckRollCompletion.pct}% — month in progress)`} />
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Monthly Completion % Trend</p>
          <LineChart data={truckRollCompletionTrend} height={48} color="#3b82f6" goalValue={95} />
        </div>
      </Section>

      {/* 7. Truck Roll Revisit Rate */}
      <Section id="tr-revisit" title="7 · Truck Roll Revisit Rate" icon={RefreshCw} accent="bg-orange-50 border-orange-100 text-orange-800">
        <div className="flex items-start gap-6 mb-4">
          <div className="relative flex-shrink-0">
            <Gauge pct={truckRollRevisit.pct} color={pctColor(truckRollRevisit.pct, truckRollRevisit.goal, false)} size={72} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-800">{truckRollRevisit.pct}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            <Tile label="Completed TRs"    value={truckRollRevisit.completed}       status="neutral" />
            <Tile label="Revisit Required" value={truckRollRevisit.revisitRequired} status={goalStatus(truckRollRevisit.pct, truckRollRevisit.goal, false)} />
          </div>
        </div>
        <GoalBadge passes={truckRollRevisit.pct <= truckRollRevisit.goal} label={`Goal: <${truckRollRevisit.goal}% revisit rate (currently ${truckRollRevisit.pct}%)`} />
        <div className="mt-3">
          <LineChart data={revisitTrend} height={48} color="#f97316" goalValue={15} />
        </div>
      </Section>

      {/* 8. GNR Remote Resolution */}
      <Section id="gnr" title="8 · Gateway Not Reporting — Remote Resolution Rate" icon={TrendingUp} accent="bg-emerald-50 border-emerald-100 text-emerald-800">
        <div className="flex items-start gap-6 mb-4">
          <div className="relative flex-shrink-0">
            <Gauge pct={gnrResolution.pct} color={pctColor(gnrResolution.pct, gnrResolution.goal, true)} size={72} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-800">{gnrResolution.pct}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
            <Tile label="Total GNR Cases"     value={gnrResolution.total}             status="neutral" />
            <Tile label="Remote Resolutions"  value={gnrResolution.resolvedRemotely}  status="good" />
            <Tile label="Truck Rolls Avoided" value={gnrResolution.truckRollsAvoided} status="good" />
            <Tile label="Est. Cost Savings"   value={`$${(gnrResolution.truckRollsAvoided * gnrResolution.estimatedSavingsPerTR).toLocaleString()}`} sub={`@$${gnrResolution.estimatedSavingsPerTR}/TR`} status="good" />
          </div>
        </div>
        <GoalBadge passes={gnrResolution.pct >= gnrResolution.goal} label={`Goal: ${gnrResolution.goal}%+ remote resolutions`} />
        <div className="mt-3">
          <LineChart data={gnrTrend} height={48} color="#10b981" goalValue={40} />
        </div>
      </Section>

      {/* ─── QUALITY ─────────────────────────────────────────────────────────── */}
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest pt-1">Quality KPIs</div>

      {/* 9. Documentation Accuracy */}
      <Section id="doc-accuracy" title="9 · Documentation Accuracy" icon={FileCheck} accent="bg-purple-50 border-purple-100 text-purple-800">
        <div className="flex items-start gap-6 mb-4">
          <div className="relative flex-shrink-0">
            <Gauge pct={docAccuracy.pct} color={pctColor(docAccuracy.pct, docAccuracy.goal, true)} size={72} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-800">{docAccuracy.pct}%</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Tile label="Audited"  value={docAccuracy.audited}  status="neutral" />
              <Tile label="Complete" value={docAccuracy.complete} status={goalStatus(docAccuracy.pct, docAccuracy.goal, true)} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-500">Missing Fields</p>
              {Object.entries(docAccuracy.missingFields).map(([field, count]) => (
                <div key={field} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{field}</span>
                  <span className={`font-semibold ${count > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <GoalBadge passes={docAccuracy.pct >= docAccuracy.goal} label={`Goal: ${docAccuracy.goal}%+`} />
        <div className="mt-3">
          <LineChart data={docAccuracyHistory} height={48} color="#8b5cf6" goalValue={95} />
        </div>
      </Section>

      {/* 10. Ticket Audit Score */}
      <Section id="audit-score" title="10 · Ticket Audit Score" icon={Star} accent="bg-rose-50 border-rose-100 text-rose-800">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Accuracy',         val: latestAudit.accuracy },
            { label: 'Professionalism',  val: latestAudit.professionalism },
            { label: 'Follow-Up Quality',val: latestAudit.followUpQuality },
            { label: 'Resolution Quality',val: latestAudit.resolutionQuality },
          ].map(({ label, val }) => (
            <Tile key={label} label={label} value={val} sub="/100" status={goalStatus(val, 90, true)} />
          ))}
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl font-bold text-slate-800">{latestAudit.overall}</div>
          <div>
            <GoalBadge passes={latestAudit.overall >= 90} label="Goal: 90+" />
            <div className="text-[10px] text-slate-400 mt-1">June 2026 composite</div>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Monthly Audit Score History</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Month','Accuracy','Professionalism','Follow-Up','Resolution','Overall'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...auditScores].reverse().map(r => (
                  <tr key={r.month} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">{r.month}</td>
                    <td className="px-3 py-2 text-slate-600">{r.accuracy}</td>
                    <td className="px-3 py-2 text-slate-600">{r.professionalism}</td>
                    <td className="px-3 py-2 text-slate-600">{r.followUpQuality}</td>
                    <td className="px-3 py-2 text-slate-600">{r.resolutionQuality}</td>
                    <td className="px-3 py-2">
                      <span className={`font-bold ${goalStatus(r.overall, 90, true) === 'good' ? 'text-emerald-600' : goalStatus(r.overall, 90, true) === 'warn' ? 'text-amber-600' : 'text-red-600'}`}>{r.overall}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ─── ADDITIONAL KPIs ─────────────────────────────────────────────────── */}
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest pt-1">Additional KPIs</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 11. First Response Time */}
        <Section id="first-response" title="11 · First Response Time" icon={Clock} accent="bg-sky-50 border-sky-100 text-sky-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={firstResponse.slaCompliance} color={pctColor(firstResponse.slaCompliance, 90, true)} size={64} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-700">{firstResponse.slaCompliance}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Tile label="Avg Response" value={`${firstResponse.avgHours}h`} status={goalStatus(firstResponse.avgHours, firstResponse.goal, false)} />
              <Tile label="SLA Compliance" value={`${firstResponse.slaCompliance}%`} status={goalStatus(firstResponse.slaCompliance, 90, true)} />
            </div>
          </div>
          <GoalBadge passes={firstResponse.avgHours <= firstResponse.goal} label={`Goal: <${firstResponse.goal}h`} />
          <div className="mt-3">
            <LineChart data={firstResponseTrend} height={44} color="#0ea5e9" goalValue={4} />
          </div>
        </Section>

        {/* 12. Ticket Reopen Rate */}
        <Section id="reopen" title="12 · Ticket Reopen Rate" icon={RefreshCw} accent="bg-amber-50 border-amber-100 text-amber-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={reopenRate.pct} color={pctColor(reopenRate.pct, reopenRate.goal, false)} size={64} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-700">{reopenRate.pct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Tile label="Closed"   value={reopenRate.closed}   status="neutral" />
              <Tile label="Reopened" value={reopenRate.reopened} status={goalStatus(reopenRate.pct, reopenRate.goal, false)} />
            </div>
          </div>
          <GoalBadge passes={reopenRate.pct <= reopenRate.goal} label={`Goal: <${reopenRate.goal}%`} />
          <div className="mt-3">
            <LineChart data={reopenTrend} height={44} color="#f59e0b" goalValue={5} />
          </div>
        </Section>

        {/* 13. Escalation Rate */}
        <Section id="escalation-rate" title="13 · Escalation Rate" icon={AlertTriangle} accent="bg-red-50 border-red-100 text-red-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={escalationRate.pct} color={pctColor(escalationRate.pct, escalationRate.goal, false)} size={64} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-700">{escalationRate.pct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Tile label="Total Tickets" value={escalationRate.total}     status="neutral" />
              <Tile label="Escalated"     value={escalationRate.escalated} status={goalStatus(escalationRate.pct, escalationRate.goal, false)} />
            </div>
          </div>
          <GoalBadge passes={escalationRate.pct <= escalationRate.goal} label={`Goal: <${escalationRate.goal}%`} />
          <div className="mt-3">
            <LineChart data={escalationTrend} height={44} color="#ef4444" goalValue={5} />
          </div>
        </Section>

        {/* 14. Collection Recovery Rate */}
        <Section id="collections" title="14 · Collection Recovery Rate" icon={DollarSign} accent="bg-green-50 border-green-100 text-green-800">
          <div className="flex items-start gap-4 mb-3">
            <div className="relative flex-shrink-0">
              <Gauge pct={collectionRecovery.pct} color={pctColor(collectionRecovery.pct, 70, true)} size={64} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-700">{collectionRecovery.pct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Tile label="Delinquent Accts" value={collectionRecovery.delinquent} status="neutral" />
              <Tile label="Recovered"        value={collectionRecovery.recovered}  status="good" />
              <Tile label="Amount Recovered" value={`$${collectionRecovery.amountRecovered.toLocaleString()}`} status="good" />
              <Tile label="Total Delinquent" value={`$${collectionRecovery.amountTotal.toLocaleString()}`} status="neutral" />
            </div>
          </div>
          <div className="mt-3">
            <LineChart data={collectionTrend} height={44} color="#22c55e" />
          </div>
        </Section>

      </div>

      {/* ─── MONTHLY SCORECARD ───────────────────────────────────────────────── */}
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest pt-1">Monthly Scorecard</div>

      <Section id="scorecard" title="Employee Performance Scorecard" icon={Award} accent="bg-slate-800 border-slate-700 text-white">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Jun Score',     value: latestScore.weighted, grade: latestScore.grade },
            { label: 'Q2 Score',      value: quarterlyScore,       grade: quarterlyScore >= 95 ? 'A' : quarterlyScore >= 90 ? 'B' : quarterlyScore >= 80 ? 'C' : 'D' },
            { label: 'YTD Score',     value: annualScore,          grade: annualScore >= 95 ? 'A' : annualScore >= 90 ? 'B' : annualScore >= 80 ? 'C' : 'D' },
          ].map(({ label, value, grade }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-slate-800">{value}</div>
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ring-1 text-base font-bold mt-1 ${gradeColor(grade)}`}>{grade}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Grade legend */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[['A','95-100'],['B','90-94'],['C','80-89'],['D','70-79'],['F','<70']].map(([g, r]) => (
            <span key={g} className={`text-[11px] font-medium px-2 py-0.5 rounded ring-1 ${gradeColor(g)}`}>{g}: {r}</span>
          ))}
        </div>

        {/* Weights reference */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">Scorecard Weights</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {[
              ['CSAT', '20%'], ['Follow-Up Compliance', '20%'],
              ['Resolution Time', '15%'], ['Collection Recovery', '15%'],
              ['First Response', '10%'], ['Doc Accuracy', '10%'],
              ['Escalation Rate', '5%'], ['Reopen Rate', '5%'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs text-slate-600 bg-white rounded px-2 py-1 border border-slate-200">
                <span>{k}</span><span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly history table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Month','CSAT','1st Resp.','Follow-Up','Resolution','Doc Acc.','Collections','Escal.','Reopen','Score','Grade'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[...scorecard].reverse().map(r => (
                <tr key={r.month} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-700">{r.month}</td>
                  <td className="px-3 py-2 text-slate-600">{r.csat}</td>
                  <td className="px-3 py-2 text-slate-600">{r.firstResponse}</td>
                  <td className="px-3 py-2 text-slate-600">{r.followUpCompliance}</td>
                  <td className="px-3 py-2 text-slate-600">{r.resolutionTime}</td>
                  <td className="px-3 py-2 text-slate-600">{r.docAccuracy}</td>
                  <td className="px-3 py-2 text-slate-600">{r.collectionRecovery}</td>
                  <td className="px-3 py-2 text-slate-600">{r.escalationRate}</td>
                  <td className="px-3 py-2 text-slate-600">{r.reopenRate}</td>
                  <td className="px-3 py-2 font-bold text-slate-800">{r.weighted}</td>
                  <td className="px-3 py-2">
                    <span className={`font-bold text-sm ring-1 px-1.5 py-0.5 rounded ${gradeColor(r.grade)}`}>{r.grade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scorecard bar chart */}
        <div className="mt-4">
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Monthly Weighted Score Trend</p>
          <BarChart data={scorecard.map(s => ({ value: s.weighted }))} labels={scorecard.map(s => s.month)} height={64} color="#6366f1" />
        </div>
      </Section>

    </div>
  );
}
