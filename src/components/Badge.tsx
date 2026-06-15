import type { Priority, CaseStatus } from '../data/sampleData';
import type { RiskLevel } from '../utils/caseLogic';

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    Urgent: 'bg-red-100 text-red-700 border border-red-200',
    High: 'bg-orange-100 text-orange-700 border border-orange-200',
    Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    Low: 'bg-slate-100 text-slate-600 border border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${styles[priority]}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: CaseStatus | string }) {
  const styles: Record<string, string> = {
    'New': 'bg-blue-100 text-blue-700 border border-blue-200',
    'In Progress': 'bg-blue-100 text-blue-700 border border-blue-200',
    'Waiting on Customer': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    'Waiting on Internal Team': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    'Truck Roll Scheduled': 'bg-blue-100 text-blue-700 border border-blue-200',
    'Pending Approval': 'bg-purple-100 text-purple-700 border border-purple-200',
    'Revisit Required': 'bg-orange-100 text-orange-700 border border-orange-200',
    'Resolved': 'bg-green-100 text-green-700 border border-green-200',
    'Closed': 'bg-slate-100 text-slate-500 border border-slate-200',
    'Escalation': 'bg-red-100 text-red-700 border border-red-200',
    'Scheduled': 'bg-blue-100 text-blue-700 border border-blue-200',
    'Completed': 'bg-green-100 text-green-700 border border-green-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const styles: Record<RiskLevel, string> = {
    Critical: 'bg-red-600 text-white',
    High:     'bg-orange-500 text-white',
    Medium:   'bg-yellow-400 text-slate-900',
    Low:      'bg-green-100 text-green-700 border border-green-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${styles[level]}`}>
      {level === 'Critical' && '🔴 '}
      {level === 'High' && '🟠 '}
      {level === 'Medium' && '🟡 '}
      {level === 'Low' && '🟢 '}
      {level}
      {score !== undefined && <span className="opacity-75 font-normal">({score})</span>}
    </span>
  );
}

export function WaitingBadge({ waitingOn }: { waitingOn: string }) {
  if (!waitingOn || waitingOn === 'None') return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
      ⏳ {waitingOn}
    </span>
  );
}
