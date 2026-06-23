import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Phone, Mail, MapPin, Calendar, User, Zap, AlertTriangle, Truck, Wand2, ChevronRight, ShieldAlert, Info } from 'lucide-react';
import { cases, truckRolls } from '../data/sampleData';
import { PriorityBadge, StatusBadge, WaitingBadge, RiskBadge } from '../components/Badge';
import { useState } from 'react';
import {
  computeRisk, daysOpen as calcDaysOpen, daysSinceLastUpdate,
  isOverdue, isDueToday, hasNoRecentUpdate,
  isTruckRollMissingOutcome, needsCustomerUpdateAfterTruckRoll,
} from '../utils/caseLogic';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const c = cases.find(cs => cs.id === id);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [actionVisible, setActionVisible] = useState(false);
  const [riskVisible, setRiskVisible] = useState(false);

  if (!c) return (
    <div className="text-center py-20 text-slate-400 text-sm">
      Case not found. <Link to="/cases" className="text-blue-600 hover:underline">Back to cases</Link>
    </div>
  );

  const truckRoll = c.truckRollId ? truckRolls.find(t => t.id === c.truckRollId) : null;
  const daysOpen = calcDaysOpen(c);
  const sinceUpdate = daysSinceLastUpdate(c);
  const risk = computeRisk(c, truckRoll ?? undefined);
  const overdue = isOverdue(c);
  const dueToday = isDueToday(c);
  const noUpdate = hasNoRecentUpdate(c);
  const missingOutcome = truckRoll ? isTruckRollMissingOutcome(truckRoll) : false;
  const needsCustomerUpdate = truckRoll ? needsCustomerUpdateAfterTruckRoll(truckRoll) : false;

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
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/cases" className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 mb-2">
            <ArrowLeft size={12} /> Back to Cases
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">{c.customerName}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-slate-400 text-xs">{c.id}</span>
            <span className="text-slate-300">·</span>
            <PriorityBadge priority={c.priority} />
            <StatusBadge status={c.status} />
            <RiskBadge level={risk.level} score={risk.score} />
            {c.waitingOn !== 'None' && <WaitingBadge waitingOn={c.waitingOn} />}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {overdue && <span className="text-[11px] bg-red-50 text-red-700 ring-1 ring-red-200 px-2 py-0.5 rounded-md font-medium">⚠ Overdue</span>}
            {dueToday && <span className="text-[11px] bg-amber-50 text-amber-700 ring-1 ring-amber-200 px-2 py-0.5 rounded-md font-medium">📅 Due today</span>}
            {noUpdate && <span className="text-[11px] bg-orange-50 text-orange-700 ring-1 ring-orange-200 px-2 py-0.5 rounded-md font-medium">No update {sinceUpdate}d</span>}
            {missingOutcome && <span className="text-[11px] bg-orange-50 text-orange-700 ring-1 ring-orange-200 px-2 py-0.5 rounded-md font-medium">TR outcome missing</span>}
            {needsCustomerUpdate && <span className="text-[11px] bg-orange-50 text-orange-700 ring-1 ring-orange-200 px-2 py-0.5 rounded-md font-medium">Customer not updated</span>}
          </div>
        </div>
        <a href={c.hubspotLink} className="flex items-center gap-1.5 text-xs text-blue-600 ring-1 ring-blue-200 px-2.5 py-1.5 rounded-md hover:bg-blue-50 flex-shrink-0">
          <ExternalLink size={12} /> HubSpot
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="space-y-3">
          {/* Customer Info */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-600 text-xs uppercase tracking-wide mb-3 flex items-center gap-1.5"><User size={12} /> Customer</h2>
            <dl className="space-y-2">
              <div className="flex items-start gap-2">
                <Phone size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-700">{c.customerPhone}</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-700 break-all">{c.customerEmail}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-700">{c.customerAddress}</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-700">{c.systemSize} · Installed {c.installDate}</span>
              </div>
            </dl>
          </div>

          {/* Case Meta */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-600 text-xs uppercase tracking-wide mb-3">Case Details</h2>
            <dl className="space-y-2">
              {[
                ['Date Opened', `${c.dateOpened} (${daysOpen}d)`],
                ['Last Updated', `${c.lastUpdate} (${sinceUpdate}d ago)`],
                ['Next Follow-Up', c.nextFollowUp ? `${c.nextFollowUp}${overdue ? ' ⚠' : dueToday ? ' 📅' : ''}` : '—'],
                ['Owner', c.owner],
                ['Waiting On', c.waitingOn],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-xs text-slate-500">{k}</span>
                  <span className="text-xs text-slate-800 font-medium text-right">{v}</span>
                </div>
              ))}
            </dl>
          </div>

          {/* Risk Score */}
          <div className={`rounded-lg border p-4 ${risk.level === 'Critical' ? 'bg-red-50 border-red-200' : risk.level === 'High' ? 'bg-orange-50 border-orange-200' : risk.level === 'Medium' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-slate-600 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert size={12} /> Calculated Risk
              </h2>
              <RiskBadge level={risk.level} score={risk.score} />
            </div>
            <p className="text-[10px] text-slate-400 mb-1">Score is a weighted sum (not a percentage). Low &lt;20 · Medium 20–39 · High 40–69 · Critical 70+</p>
            <button
              onClick={() => setRiskVisible(!riskVisible)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <Info size={11} /> {riskVisible ? 'Hide' : 'Show'} breakdown
            </button>
            {riskVisible && (
              <ul className="mt-2 space-y-1">
                {risk.reasons.map((r, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {c.escalations.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="font-semibold text-red-700 text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} /> Escalations
              </h2>
              <div className="flex flex-wrap gap-1">
                {c.escalations.map(e => (
                  <span key={e} className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 text-red-700 ring-1 ring-red-200 text-xs font-medium">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-3">
          {/* Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-600 text-xs uppercase tracking-wide mb-2">Case Summary</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{c.summary}</p>
          </div>

          {/* Root Cause */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-600 text-xs uppercase tracking-wide mb-2">Root Cause</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{c.rootCause}</p>
          </div>

          {/* Next Action */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-amber-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Calendar size={12} /> Next Action
              </h2>
              <span className="text-xs text-amber-700 bg-amber-100 ring-1 ring-amber-200 px-2 py-0.5 rounded-md">
                {c.nextFollowUp || 'TBD'}
              </span>
            </div>
            <p className="text-sm text-amber-800">{c.nextAction}</p>
          </div>

          {/* AI Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSummaryVisible(!summaryVisible)}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <Wand2 size={12} /> Generate Summary
            </button>
            <button
              onClick={() => setActionVisible(!actionVisible)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <ChevronRight size={12} /> Recommend Action
            </button>
          </div>

          {summaryVisible && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Wand2 size={12} className="text-purple-600" />
                <span className="text-xs font-semibold text-purple-700">Generated Case Summary</span>
              </div>
              <pre className="text-xs text-purple-800 whitespace-pre-wrap font-mono leading-relaxed">{generatedSummary}</pre>
            </div>
          )}

          {actionVisible && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <ChevronRight size={12} className="text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">Recommended Next Actions</span>
              </div>
              <pre className="text-xs text-blue-800 whitespace-pre-wrap leading-relaxed">{recommendedAction}</pre>
            </div>
          )}

          {/* Truck Roll */}
          {truckRoll && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h2 className="font-semibold text-slate-600 text-xs uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Truck size={12} /> Truck Roll — {truckRoll.id}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Technician', truckRoll.technician],
                  ['Visit Date', truckRoll.visitDate],
                  ['Status', truckRoll.status],
                  ['RMA Required', truckRoll.rmaRequired ? `Yes — ${truckRoll.rmaCaseNumber}` : 'No'],
                  ['Revisit Needed', truckRoll.revisitRequired ? 'Yes' : truckRoll.isRevisitNeeded === null ? 'TBD' : 'No'],
                  ['Customer Updated', truckRoll.customerUpdated ? 'Yes' : 'No'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[10px] text-slate-400">{k}</div>
                    <div className="text-xs font-medium text-slate-700 mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              {truckRoll.outcome && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-[10px] text-slate-400 mb-1">Outcome</div>
                  <p className="text-xs text-slate-700">{truckRoll.outcome}</p>
                </div>
              )}
              <Link to="/truck-roll" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                View full truck roll <ExternalLink size={10} />
              </Link>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-600 text-xs uppercase tracking-wide mb-3">Timeline</h2>
            <div className="space-y-3">
              {[...c.timeline].reverse().map((note, i) => (
                <div key={note.id} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${i === 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                    {i < c.timeline.length - 1 && <div className="w-px bg-slate-100 flex-1 mt-1" />}
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-slate-700">{note.author}</span>
                      <span className="text-xs text-slate-400">{note.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{note.note}</p>
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
