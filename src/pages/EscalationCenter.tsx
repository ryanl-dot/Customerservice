import { Link } from 'react-router-dom';
import { AlertTriangle, Shield, Scale, DollarSign, Tv, FileWarning, UserX, CheckCircle2 } from 'lucide-react';
import { cases } from '../data/sampleData';
import type { EscalationType } from '../data/sampleData';
import { PriorityBadge, StatusBadge } from '../components/Badge';

const ESCALATION_TYPES: { type: EscalationType; label: string; icon: any; color: string; accent: string }[] = [
  { type: 'AG Complaint',         label: 'AG Complaint',        icon: Scale,        color: 'text-red-700',    accent: 'bg-red-50 border-red-100 text-red-700' },
  { type: 'PSC Complaint',        label: 'PSC Complaint',       icon: Shield,       color: 'text-red-700',    accent: 'bg-red-50 border-red-100 text-red-700' },
  { type: 'NYSERDA Complaint',    label: 'NYSERDA',             icon: FileWarning,  color: 'text-orange-700', accent: 'bg-orange-50 border-orange-100 text-orange-700' },
  { type: 'BBB Complaint',        label: 'BBB Complaint',       icon: Shield,       color: 'text-orange-700', accent: 'bg-orange-50 border-orange-100 text-orange-700' },
  { type: 'Attorney Mentioned',   label: 'Attorney',            icon: Scale,        color: 'text-red-800',    accent: 'bg-red-50 border-red-200 text-red-800' },
  { type: 'Refund Request',       label: 'Refund Request',      icon: DollarSign,   color: 'text-purple-700', accent: 'bg-purple-50 border-purple-100 text-purple-700' },
  { type: 'Media / NBC Responds', label: 'Media',               icon: Tv,           color: 'text-rose-700',   accent: 'bg-rose-50 border-rose-100 text-rose-700' },
  { type: 'Legal Threat',         label: 'Legal Threat',        icon: UserX,        color: 'text-red-900',    accent: 'bg-red-100 border-red-200 text-red-900' },
];

export default function EscalationCenter() {
  const escalatedCases = cases.filter(c => c.escalations.length > 0);
  const totalEscalations = escalatedCases.reduce((sum, c) => sum + c.escalations.length, 0);

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Escalation Center</h1>
        <p className="text-xs text-slate-400 mt-0.5">{escalatedCases.length} cases · {totalEscalations} escalation flags</p>
      </div>

      {/* Warning banner */}
      {escalatedCases.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2.5">
          <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-800">Active escalations require immediate attention.</p>
            <p className="text-xs text-red-600 mt-0.5">Legal escalations must be reported to the legal team. All escalated cases require management review.</p>
          </div>
        </div>
      )}

      {/* Overview chips */}
      <div className="flex flex-wrap gap-2">
        {ESCALATION_TYPES.map(({ type, label, icon: Icon, accent }) => {
          const count = cases.filter(c => c.escalations.includes(type)).length;
          if (count === 0) return null;
          return (
            <div key={type} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ring-1 ${accent}`}>
              <Icon size={11} />
              <span>{label}</span>
              <span className="font-bold">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Escalated Cases */}
      {escalatedCases.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">No Active Escalations</p>
          <p className="text-xs text-slate-400 mt-1">All cases are within normal handling parameters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {escalatedCases.map(c => (
            <div key={c.id} className="bg-white border border-red-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-red-50 border-b border-red-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/cases/${c.id}`} className="font-semibold text-slate-800 hover:text-blue-600 text-sm">{c.customerName}</Link>
                  <span className="text-xs text-slate-400">{c.id} · {c.caseType}</span>
                  <PriorityBadge priority={c.priority} />
                  <StatusBadge status={c.status} />
                </div>
                <Link to={`/cases/${c.id}`} className="text-xs text-blue-600 hover:text-blue-700 flex-shrink-0">View →</Link>
              </div>
              <div className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {c.escalations.map(e => {
                    const config = ESCALATION_TYPES.find(et => et.type === e);
                    return (
                      <span key={e} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${config?.accent ?? 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
                        {config && <config.icon size={10} />}
                        {e}
                      </span>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide">Summary</div>
                    <p className="text-xs text-slate-700 leading-relaxed">{c.summary}</p>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide">Next Action</div>
                    <p className="text-xs text-slate-700 leading-relaxed">{c.nextAction}</p>
                    <div className="text-[10px] text-slate-400 mt-2">
                      Owner: <span className="text-slate-700 font-medium">{c.owner}</span>
                      <span className="mx-1.5">·</span>
                      Follow-Up: <span className="text-slate-700 font-medium">{c.nextFollowUp || '—'}</span>
                    </div>
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
