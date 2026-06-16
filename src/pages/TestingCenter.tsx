import { FlaskConical, CheckCircle2, XCircle, Clock } from 'lucide-react';

const testSuites = [
  { name: 'Ticket Closure Calculation', status: 'pass', ms: 12 },
  { name: 'Resolution Time by Type',    status: 'pass', ms: 8 },
  { name: 'Aging Ticket Percentage',    status: 'pass', ms: 6 },
  { name: 'Follow-Up Compliance Logic', status: 'pass', ms: 11 },
  { name: 'Risk Score Computation',     status: 'pass', ms: 15 },
  { name: 'Truck Roll Completion Rate', status: 'pass', ms: 9 },
  { name: 'GNR Remote Resolution Rate', status: 'pass', ms: 7 },
  { name: 'Scorecard Weighted Average', status: 'pass', ms: 5 },
  { name: 'isOverdue()',                status: 'pass', ms: 3 },
  { name: 'isDueToday()',               status: 'pass', ms: 3 },
  { name: 'hasNoRecentUpdate()',        status: 'pass', ms: 4 },
  { name: 'computeRisk()',              status: 'pass', ms: 14 },
  { name: 'buildDailySummary()',        status: 'pass', ms: 18 },
  { name: 'isTruckRollMissingOutcome()',status: 'pass', ms: 5 },
  { name: 'needsCustomerUpdateAfterTR()',status:'pass', ms: 4 },
];

export default function TestingCenter() {
  const passed = testSuites.filter(t => t.status === 'pass').length;
  const failed = testSuites.filter(t => t.status === 'fail').length;
  const totalMs = testSuites.reduce((s, t) => s + t.ms, 0);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-800">Testing Center</h1>
        <span className="text-[11px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded-md">Admin Only</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 ring-1 ring-emerald-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{passed}</div>
          <div className="text-xs text-emerald-700 font-medium mt-0.5">Passing</div>
        </div>
        <div className={`rounded-lg p-3 text-center ring-1 ${failed > 0 ? 'bg-red-50 ring-red-200' : 'bg-slate-50 ring-slate-200'}`}>
          <div className={`text-2xl font-bold ${failed > 0 ? 'text-red-600' : 'text-slate-400'}`}>{failed}</div>
          <div className={`text-xs font-medium mt-0.5 ${failed > 0 ? 'text-red-700' : 'text-slate-500'}`}>Failing</div>
        </div>
        <div className="bg-slate-50 ring-1 ring-slate-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-slate-600">{totalMs}ms</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Total Time</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <FlaskConical size={13} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Test Suites — Mock Results</span>
          <span className="ml-auto text-[10px] text-slate-400">{testSuites.length} tests</span>
        </div>
        <div className="divide-y divide-slate-50">
          {testSuites.map(t => (
            <div key={t.name} className="flex items-center gap-3 px-4 py-2.5">
              {t.status === 'pass'
                ? <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                : <XCircle size={13} className="text-red-500 flex-shrink-0" />
              }
              <span className="text-xs text-slate-700 flex-1">{t.name}</span>
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
    </div>
  );
}
