import { BarChart2, TrendingUp, ShieldAlert, Users, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const execKPIs = [
  { label: 'Open Tickets',        value: '14',    goal: null,    status: 'neutral' },
  { label: 'Due Today',           value: '4',     goal: null,    status: 'warn' },
  { label: 'Over SLA',            value: '2',     goal: '0',     status: 'bad' },
  { label: 'Avg Resolution',      value: '12.0d', goal: '<14d',  status: 'good' },
  { label: 'TR Completion',       value: '60%',   goal: '95%',   status: 'bad' },
  { label: 'TR Revisit Rate',     value: '33%',   goal: '<15%',  status: 'bad' },
  { label: 'GNR Remote Res.',     value: '50%',   goal: '40%+',  status: 'good' },
  { label: 'Doc Accuracy',        value: '85%',   goal: '95%',   status: 'warn' },
  { label: 'Follow-Up Comply.',   value: '85.7%', goal: '100%',  status: 'warn' },
  { label: 'Monthly Score',       value: '84',    goal: '90+',   status: 'warn' },
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
  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-800">Executive Dashboard</h1>
        <span className="text-[11px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded-md">Admin Only</span>
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
            {[
              'TR Completion Rate 60% — goal 95%',
              'TR Revisit Rate 33% — goal <15%',
              '2 tickets over SLA',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-xs text-red-700 bg-red-50 ring-1 ring-red-100 rounded px-2 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5 flex-shrink-0" />{item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700">Watch Closely</h2>
          </div>
          <ul className="space-y-2">
            {[
              'Follow-Up Compliance 85.7% — goal 100%',
              'Doc Accuracy 85% — goal 95%',
              'Monthly Score 84 — goal 90+',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 ring-1 ring-amber-100 rounded px-2 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5 flex-shrink-0" />{item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-700">On Track</h2>
          </div>
          <ul className="space-y-2">
            {[
              'Avg Resolution 12d — goal <14d',
              'GNR Remote Rate 50% — goal 40%+',
              'Escalation Rate 4% — goal <5%',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100 rounded px-2 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5 flex-shrink-0" />{item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open Cases',   value: 14,   icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'High Risk',    value: 3,    icon: ShieldAlert, color: 'text-red-600',    bg: 'bg-red-50' },
          { label: 'Escalations',  value: 5,    icon: AlertTriangle,color:'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Monthly Score',value: '84', icon: BarChart2,   color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Avg Days Open',value: '12.0d',icon: TrendingUp, color: 'text-teal-600',  bg: 'bg-teal-50' },
          { label: 'Due Today',    value: 4,    icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'GNR Resolved', value: '50%',icon: CheckCircle2,color: 'text-emerald-600',bg: 'bg-emerald-50' },
          { label: 'TR Completion',value: '60%',icon: TrendingUp,  color: 'text-red-600',    bg: 'bg-red-50' },
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
