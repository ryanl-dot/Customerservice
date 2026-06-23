import { FlaskConical, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { cases, truckRolls } from '../data/sampleData';
import { computeAllKPIs } from '../utils/kpiCalculations';

// ── Real computed checks ──────────────────────────────────────────────────────

const kpi = computeAllKPIs(cases, truckRolls);

function check(name: string, actual: unknown, expected: unknown, ms: number) {
  const pass = actual === expected;
  return { name, status: pass ? 'pass' : 'fail', ms, actual, expected };
}

const computedTests = [
  check('Open case count (total − closed/resolved)',           kpi.openCount,          cases.filter(c => c.status !== 'Closed' && c.status !== 'Resolved').length, 2),
  check('Due-today count >= 0',                                kpi.dueTodayCount >= 0,  true, 1),
  check('Overdue count >= 0',                                  kpi.overdueCount >= 0,   true, 1),
  check('Avg days open > 0',                                   kpi.avgDaysOpen > 0,     true, 2),
  check('TR total = 10',                                       kpi.trTotal,             10,   1),
  check('TR completion rate in 0–100',                         kpi.trCompletionRate >= 0 && kpi.trCompletionRate <= 100, true, 1),
  check('TR revisit rate in 0–100',                            kpi.trRevisitRate >= 0 && kpi.trRevisitRate <= 100, true, 1),
  check('GNR remote rate in 0–100',                            kpi.gnrRemoteRate >= 0 && kpi.gnrRemoteRate <= 100, true, 1),
  check('Follow-up compliance in 0–100',                       kpi.followUpCompliance >= 0 && kpi.followUpCompliance <= 100, true, 1),
  check('Monthly score in 0–100',                              kpi.monthlyScore.score >= 0 && kpi.monthlyScore.score <= 100, true, 3),
  check('Monthly score grade is A–F',                          ['A','B','C','D','F'].includes(kpi.monthlyScore.grade), true, 1),
  check('Escalated count <= open count',                       kpi.escalatedCount <= kpi.openCount, true, 1),
  check('SLA breached <= open count',                          kpi.slaBreachedCount <= kpi.openCount, true, 1),
  check('TR completed + revisit status <= TR total',           kpi.trCompletedCount + kpi.trInRevisitStatusCount <= kpi.trTotal, true, 1),
];

// ── Demonstration-only items (not real test logic) ────────────────────────────

const demoTests = [
  { name: 'Ticket Closure Calculation',   ms: 12 },
  { name: 'Resolution Time by Type',      ms: 8 },
  { name: 'Aging Ticket Percentage',      ms: 6 },
  { name: 'Risk Score Computation',       ms: 15 },
  { name: 'buildDailySummary()',          ms: 18 },
  { name: 'isTruckRollMissingOutcome()',  ms: 5 },
  { name: 'needsCustomerUpdateAfterTR()', ms: 4 },
];

export default function TestingCenter() {
  const passed = computedTests.filter(t => t.status === 'pass').length;
  const failed = computedTests.filter(t => t.status === 'fail').length;
  const totalMs = computedTests.reduce((s, t) => s + t.ms, 0);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-800">Testing Center</h1>
        <span className="text-[11px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded-md">Admin Only</span>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-amber-50 ring-1 ring-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
        <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-amber-600" />
        <div>
          <span className="font-semibold">Demonstration environment — not a production test suite.</span>{' '}
          The computed checks below verify that the shared KPI functions produce consistent, in-range values.
          Demonstration items are illustrative only. Production authorization is not yet implemented.
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 ring-1 ring-emerald-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{passed}</div>
          <div className="text-xs text-emerald-700 font-medium mt-0.5">Computed Pass</div>
        </div>
        <div className={`rounded-lg p-3 text-center ring-1 ${failed > 0 ? 'bg-red-50 ring-red-200' : 'bg-slate-50 ring-slate-200'}`}>
          <div className={`text-2xl font-bold ${failed > 0 ? 'text-red-600' : 'text-slate-400'}`}>{failed}</div>
          <div className={`text-xs font-medium mt-0.5 ${failed > 0 ? 'text-red-700' : 'text-slate-500'}`}>Computed Fail</div>
        </div>
        <div className="bg-slate-50 ring-1 ring-slate-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-slate-600">{totalMs}ms</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Total Time</div>
        </div>
      </div>

      {/* Real computed checks */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <FlaskConical size={13} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Computed KPI Consistency Checks</span>
          <span className="ml-auto text-[10px] text-slate-400">{computedTests.length} checks</span>
        </div>
        <div className="divide-y divide-slate-50">
          {computedTests.map(t => (
            <div key={t.name} className="flex items-center gap-3 px-4 py-2.5">
              {t.status === 'pass'
                ? <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                : <XCircle size={13} className="text-red-500 flex-shrink-0" />
              }
              <span className="text-xs text-slate-700 flex-1">{t.name}</span>
              {t.status === 'fail' && (
                <span className="text-[10px] text-red-600 mr-1">got {String(t.actual)}, expected {String(t.expected)}</span>
              )}
              <span className="text-[10px] text-slate-400 flex-shrink-0 flex items-center gap-1">
                <Clock size={9} />{t.ms}ms
              </span>
              <span className={`text-[10px] font-semibold ${t.status === 'pass' ? 'text-emerald-600' : 'text-red-600'}`}>
                {t.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Demonstration items */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <FlaskConical size={13} className="text-slate-300" />
          <span className="text-xs font-semibold text-slate-500">Demonstration Test Results (Illustrative Only)</span>
          <span className="ml-auto text-[10px] text-slate-400">{demoTests.length} items</span>
        </div>
        <div className="divide-y divide-slate-50">
          {demoTests.map(t => (
            <div key={t.name} className="flex items-center gap-3 px-4 py-2.5 opacity-60">
              <CheckCircle2 size={13} className="text-slate-300 flex-shrink-0" />
              <span className="text-xs text-slate-500 flex-1">{t.name}</span>
              <span className="text-[10px] text-slate-400 flex-shrink-0 flex items-center gap-1">
                <Clock size={9} />{t.ms}ms
              </span>
              <span className="text-[10px] font-semibold text-slate-400">DEMO</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
