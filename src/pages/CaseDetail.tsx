import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Phone, Mail, MapPin, Calendar, User, Zap, AlertTriangle, Truck, Wand2, ChevronRight } from 'lucide-react';
import { cases, truckRolls } from '../data/sampleData';
import { PriorityBadge, StatusBadge, WaitingBadge } from '../components/Badge';
import { useState } from 'react';

const TODAY = '2026-06-15';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const c = cases.find(cs => cs.id === id);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [actionVisible, setActionVisible] = useState(false);

  if (!c) return (
    <div className="text-center py-20 text-slate-400">
      Case not found. <Link to="/cases" className="text-blue-600 hover:underline">Back to cases</Link>
    </div>
  );

  const truckRoll = c.truckRollId ? truckRolls.find(t => t.id === c.truckRollId) : null;
  const daysOpen = Math.floor((new Date(TODAY).getTime() - new Date(c.dateOpened).getTime()) / 86400000);

  const generatedSummary = `Case ${c.id} — ${c.customerName}
Type: ${c.caseType} | Priority: ${c.priority} | Status: ${c.status}
Opened: ${c.dateOpened} (${daysOpen} days ago)
Owner: ${c.owner}

Summary: ${c.summary}

Root Cause: ${c.rootCause}

Current Waiting On: ${c.waitingOn}
Next Follow-Up: ${c.nextFollowUp || 'Not scheduled'}
${c.escalations.length > 0 ? `\nActive Escalations: ${c.escalations.join(', ')}` : ''}

Last Note (${c.timeline[c.timeline.length - 1]?.date}):
"${c.timeline[c.timeline.length - 1]?.note}"`;

  const recommendedActions: Record<string, string> = {
    'New': `1. Review case details and verify customer contact info.\n2. Call customer to acknowledge receipt of case.\n3. Log initial notes and assign priority.\n4. Set follow-up date within 2 business days.`,
    'In Progress': `1. Review all timeline notes and last update.\n2. Follow up with ${c.waitingOn !== 'None' ? c.waitingOn : 'customer'} on pending items.\n3. Update case status and log detailed notes.\n4. Confirm next follow-up date is set.`,
    'Waiting on Customer': `1. Send follow-up email using "Waiting on Customer" template.\n2. Attempt phone contact if no response in 48 hours.\n3. Document all contact attempts in timeline.`,
    'Waiting on Internal Team': `1. Send internal follow-up to ${c.waitingOn} team.\n2. Escalate if no response within 24 hours.\n3. Update customer with status.`,
    'Truck Roll Scheduled': `1. Confirm appointment with technician and customer 24 hours before.\n2. Verify technician has all required parts/equipment.\n3. Create outcome form reminder for post-visit completion.`,
    'Revisit Required': `1. Schedule revisit as soon as possible.\n2. Review outcome of prior truck roll to ensure tech brings correct equipment.\n3. Update customer with revised appointment date.`,
    'Pending Approval': `1. Follow up with management/approver daily.\n2. Document escalation if approval delayed more than 48 hours.\n3. Keep customer informed of status.`,
    'Escalation': `1. Immediate escalation to senior management required.\n2. Do not make any commitments to customer without management approval.\n3. Document all escalation details in timeline.\n4. Contact legal team if attorney or complaint mentioned.`,
  };

  const recommendedAction = recommendedActions[c.status] || `Review case and determine next steps based on case type: ${c.caseType}.`;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/cases" className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-2">
            <ArrowLeft size={14} /> Back to Cases
          </Link>
          <h1 className="text-xl font-bold text-slate-800">{c.customerName}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-slate-400 text-sm">{c.id}</span>
            <span className="text-slate-300">·</span>
            <PriorityBadge priority={c.priority} />
            <StatusBadge status={c.status} />
            {c.waitingOn !== 'None' && <WaitingBadge waitingOn={c.waitingOn} />}
          </div>
        </div>
        <a href={c.hubspotLink} className="flex items-center gap-2 text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">
          <ExternalLink size={14} /> HubSpot
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2"><User size={14} /> Customer Information</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Phone size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{c.customerPhone}</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 break-all">{c.customerEmail}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{c.customerAddress}</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{c.systemSize} system · Installed {c.installDate}</span>
              </div>
            </dl>
          </div>

          {/* Case Meta */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-700 text-sm mb-4">Case Details</h2>
            <dl className="space-y-2 text-sm">
              {[
                ['Case Type', c.caseType],
                ['Owner', c.owner],
                ['Date Opened', `${c.dateOpened} (${daysOpen}d)`],
                ['Last Update', c.lastUpdate],
                ['Next Follow-Up', c.nextFollowUp || '—'],
                ['Waiting On', c.waitingOn],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-800 font-medium text-right">{v}</span>
                </div>
              ))}
            </dl>
          </div>

          {/* Escalations */}
          {c.escalations.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h2 className="font-semibold text-red-700 text-sm mb-3 flex items-center gap-2">
                <AlertTriangle size={14} /> Active Escalations
              </h2>
              <div className="space-y-1">
                {c.escalations.map(e => (
                  <span key={e} className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold mr-1 mb-1">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-700 text-sm mb-3">Case Summary</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{c.summary}</p>
          </div>

          {/* Root Cause */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-700 text-sm mb-3">Root Cause</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{c.rootCause}</p>
          </div>

          {/* Next Action */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
                <Calendar size={14} /> Next Action
              </h2>
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                Due: {c.nextFollowUp || 'TBD'}
              </span>
            </div>
            <p className="text-sm text-amber-800">{c.nextAction}</p>
          </div>

          {/* AI Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setSummaryVisible(!summaryVisible)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Wand2 size={15} /> Generate Case Summary
            </button>
            <button
              onClick={() => setActionVisible(!actionVisible)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <ChevronRight size={15} /> Recommend Next Action
            </button>
          </div>

          {summaryVisible && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 size={14} className="text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">Generated Case Summary</span>
              </div>
              <pre className="text-xs text-purple-800 whitespace-pre-wrap font-mono leading-relaxed">{generatedSummary}</pre>
            </div>
          )}

          {actionVisible && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ChevronRight size={14} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Recommended Next Actions</span>
              </div>
              <pre className="text-xs text-blue-800 whitespace-pre-wrap leading-relaxed">{recommendedAction}</pre>
            </div>
          )}

          {/* Truck Roll */}
          {truckRoll && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-700 text-sm mb-4 flex items-center gap-2">
                <Truck size={14} /> Related Truck Roll — {truckRoll.id}
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Technician', truckRoll.technician],
                  ['Visit Date', truckRoll.visitDate],
                  ['Status', truckRoll.status],
                  ['RMA Required', truckRoll.rmaRequired ? `Yes — ${truckRoll.rmaCaseNumber}` : 'No'],
                  ['Revisit Needed', truckRoll.revisitRequired ? 'Yes' : truckRoll.isRevisitNeeded === null ? 'TBD' : 'No'],
                  ['Customer Updated', truckRoll.customerUpdated ? 'Yes' : 'No'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs text-slate-400">{k}</div>
                    <div className="font-medium text-slate-700">{v}</div>
                  </div>
                ))}
              </div>
              {truckRoll.outcome && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-400 mb-1">Outcome</div>
                  <p className="text-sm text-slate-700">{truckRoll.outcome}</p>
                </div>
              )}
              <Link to="/truck-roll" className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                View full truck roll <ExternalLink size={11} />
              </Link>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-700 text-sm mb-4">Timeline Notes</h2>
            <div className="space-y-4">
              {[...c.timeline].reverse().map((note, i) => (
                <div key={note.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${i === 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                    {i < c.timeline.length - 1 && <div className="w-0.5 bg-slate-100 flex-1 mt-1" />}
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700">{note.author}</span>
                      <span className="text-xs text-slate-400">{note.date}</span>
                    </div>
                    <p className="text-sm text-slate-600">{note.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
