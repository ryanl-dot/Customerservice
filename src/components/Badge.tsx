import type { Priority, CaseStatus } from '../data/sampleData';
import type { RiskLevel } from '../utils/caseLogic';

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    Urgent: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    High:   'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    Medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    Low:    'bg-slate-50 text-slate-500 ring-1 ring-slate-200',
  };
  const dots: Record<Priority, string> = {
    Urgent: 'bg-red-500', High: 'bg-orange-500', Medium: 'bg-amber-400', Low: 'bg-slate-300',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${styles[priority]}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[priority]}`} />
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: CaseStatus | string }) {
  const styles: Record<string, string> = {
    'New':                     'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    'In Progress':             'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    'Waiting on Customer':     'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    'Waiting on Internal Team':'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    'Truck Roll Scheduled':    'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
    'Pending Approval':        'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
    'Revisit Required':        'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    'Resolved':                'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    'Closed':                  'bg-slate-50 text-slate-400 ring-1 ring-slate-200',
    'Scheduled':               'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
    'Completed':               'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    'In Progress (TR)':        'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    'Revisit Required (TR)':   'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    'Closed (TR)':             'bg-slate-50 text-slate-400 ring-1 ring-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${styles[status] ?? 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'}`}>
      {status}
    </span>
  );
}

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const styles: Record<RiskLevel, string> = {
    Critical: 'bg-red-600 text-white',
    High:     'bg-orange-500 text-white',
    Medium:   'bg-amber-100 text-amber-800 ring-1 ring-amber-300',
    Low:      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  };
  const dots: Record<RiskLevel, string> = {
    Critical: 'bg-red-300', High: 'bg-orange-200', Medium: 'bg-amber-400', Low: 'bg-emerald-400',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${styles[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[level]}`} />
      {level}
      {score !== undefined && <span className="opacity-60 font-normal">{score}</span>}
    </span>
  );
}

export function WaitingBadge({ waitingOn }: { waitingOn: string }) {
  if (!waitingOn || waitingOn === 'None') return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
      {waitingOn}
    </span>
  );
}
