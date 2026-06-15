import { Link } from 'react-router-dom';
import { AlertTriangle, Shield, Scale, DollarSign, Tv, FileWarning, UserX } from 'lucide-react';
import { cases } from '../data/sampleData';
import type { EscalationType } from '../data/sampleData';
import { PriorityBadge, StatusBadge } from '../components/Badge';

const ESCALATION_TYPES: { type: EscalationType; label: string; icon: any; color: string; bg: string; description: string }[] = [
  { type: 'AG Complaint', label: 'AG Complaint', icon: Scale, color: 'text-red-700', bg: 'bg-red-50 border-red-200', description: 'Attorney General complaint filed' },
  { type: 'PSC Complaint', label: 'PSC Complaint', icon: Shield, color: 'text-red-700', bg: 'bg-red-50 border-red-200', description: 'Public Service Commission complaint' },
  { type: 'NYSERDA Complaint', label: 'NYSERDA Complaint', icon: FileWarning, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', description: 'NYSERDA formal complaint' },
  { type: 'BBB Complaint', label: 'BBB Complaint', icon: Shield, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', description: 'Better Business Bureau complaint' },
  { type: 'Attorney Mentioned', label: 'Attorney Mentioned', icon: Scale, color: 'text-red-800', bg: 'bg-red-50 border-red-300', description: 'Customer mentioned consulting attorney' },
  { type: 'Refund Request', label: 'Refund Request', icon: DollarSign, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', description: 'Customer requesting refund' },
  { type: 'Media / NBC Responds', label: 'Media / NBC Responds', icon: Tv, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', description: 'Media outlet involvement' },
  { type: 'Legal Threat', label: 'Legal Threat', icon: UserX, color: 'text-red-900', bg: 'bg-red-100 border-red-300', description: 'Formal legal threat made' },
];

export default function EscalationCenter() {
  const escalatedCases = cases.filter(c => c.escalations.length > 0);
  const totalEscalations = escalatedCases.reduce((sum, c) => sum + c.escalations.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Escalation Center</h1>
        <p className="text-slate-500 text-sm">{escalatedCases.length} cases with active escalations · {totalEscalations} total escalation flags</p>
      </div>

      {/* Warning banner */}
      {escalatedCases.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Active Escalations Require Immediate Attention</p>
            <p className="text-sm text-red-600 mt-1">All escalated cases should be reviewed with management. Legal escalations require legal team notification.</p>
          </div>
        </div>
      )}

      {/* Overview grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ESCALATION_TYPES.map(({ type, label, icon: Icon, color, bg }) => {
          const count = cases.filter(c => c.escalations.includes(type)).length;
          return (
            <div key={type} className={`rounded-xl border p-4 ${bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={color} />
                <span className={`text-xs font-semibold ${color}`}>{label}</span>
              </div>
              <div className={`text-3xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-slate-400 mt-1">active case{count !== 1 ? 's' : ''}</div>
            </div>
          );
        })}
      </div>

      {/* Escalated Cases */}
      {escalatedCases.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <Shield size={32} className="text-green-400 mx-auto mb-3" />
          <p className="text-green-700 font-semibold">No Active Escalations</p>
          <p className="text-green-600 text-sm mt-1">All cases are within normal handling parameters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Escalated Cases</h2>
          {escalatedCases.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-red-200 overflow-hidden">
              <div className="flex items-start justify-between px-5 py-4 bg-red-50 border-b border-red-100">
                <div>
                  <Link to={`/cases/${c.id}`} className="font-bold text-slate-800 hover:text-blue-600">{c.customerName}</Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{c.id}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">{c.caseType}</span>
                    <span className="text-slate-300">·</span>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                </div>
                <Link to={`/cases/${c.id}`} className="text-xs text-blue-600 hover:underline">View Case →</Link>
              </div>
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {c.escalations.map(e => {
                    const config = ESCALATION_TYPES.find(et => et.type === e);
                    return (
                      <span key={e} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config?.bg || 'bg-slate-100'} ${config?.color || 'text-slate-600'}`}>
                        {config && <config.icon size={11} />}
                        {e}
                      </span>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Case Summary</div>
                    <p className="text-slate-700">{c.summary}</p>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Next Action</div>
                    <p className="text-slate-700">{c.nextAction}</p>
                    <div className="text-xs text-slate-400 mt-2">Owner: <span className="text-slate-700 font-medium">{c.owner}</span></div>
                    <div className="text-xs text-slate-400">Follow-Up: <span className="text-slate-700 font-medium">{c.nextFollowUp || '—'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
