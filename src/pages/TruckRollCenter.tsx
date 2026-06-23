import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, ClipboardX, UserX } from 'lucide-react';
import { truckRolls } from '../data/sampleData';
import { StatusBadge } from '../components/Badge';
import { isTruckRollMissingOutcome, needsCustomerUpdateAfterTruckRoll, isTruckRollPastDate } from '../utils/caseLogic';

function BoolDisplay({ val }: { val: boolean | null }) {
  if (val === null) return <span className="text-slate-300 text-xs">TBD</span>;
  return val
    ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle size={11} />Yes</span>
    : <span className="flex items-center gap-1 text-slate-400 text-xs font-medium"><XCircle size={11} />No</span>;
}

function TruckRollRow({ t }: { t: typeof truckRolls[0] }) {
  const [expanded, setExpanded] = useState(false);
  const missingOutcome = isTruckRollMissingOutcome(t);
  const needsUpdate = needsCustomerUpdateAfterTruckRoll(t);
  const pastDate = isTruckRollPastDate(t);
  const rowAlert = missingOutcome || needsUpdate || pastDate;

  return (
    <>
      <tr
        className={`hover:bg-slate-50 border-b border-slate-100 cursor-pointer ${rowAlert ? 'bg-orange-50/30' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-3 py-2.5">
          <div className="text-xs font-medium text-slate-800">{t.customerName}</div>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <span className="text-[10px] text-slate-400">{t.id}</span>
            {missingOutcome && <span className="inline-flex items-center gap-0.5 text-[10px] bg-orange-50 text-orange-700 ring-1 ring-orange-200 px-1.5 py-0.5 rounded font-medium"><ClipboardX size={9} />Missing</span>}
            {needsUpdate && <span className="inline-flex items-center gap-0.5 text-[10px] bg-orange-50 text-orange-700 ring-1 ring-orange-200 px-1.5 py-0.5 rounded font-medium"><UserX size={9} />Not Updated</span>}
            {pastDate && <span className="text-[10px] bg-red-50 text-red-700 ring-1 ring-red-200 px-1.5 py-0.5 rounded font-medium">Past Date</span>}
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{t.issueType}</td>
        <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{t.technician}</td>
        <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{t.visitDate}</td>
        <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>
        <td className="px-3 py-2.5">
          {t.revisitRequired
            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-orange-50 text-orange-700 ring-1 ring-orange-200"><AlertCircle size={10} />Yes</span>
            : <span className="text-slate-300 text-xs">—</span>}
        </td>
        <td className="px-3 py-2.5">
          {t.rmaRequired
            ? <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-200">Yes</span>
            : <span className="text-slate-300 text-xs">—</span>}
        </td>
        <td className="px-3 py-2.5"><BoolDisplay val={t.customerUpdated} /></td>
        <td className="px-3 py-2.5">
          <Link to={`/cases/${t.caseId}`} className="text-xs text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>{t.caseId}</Link>
        </td>
        <td className="px-3 py-2.5">
          {expanded ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50 border-b border-slate-100">
          <td colSpan={10} className="px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Outcome Details</h3>
                <div>
                  <div className="text-[10px] text-slate-400 mb-0.5">Troubleshoot Issue</div>
                  <p className="text-xs text-slate-700">{t.troubleshootIssue || <span className="text-slate-300 italic">Not completed</span>}</p>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 mb-0.5">Outcome Summary</div>
                  <p className="text-xs text-slate-700">{t.outcome || <span className="text-slate-300 italic">Not completed</span>}</p>
                </div>
                {t.rmaRequired && (
                  <div>
                    <div className="text-[10px] text-slate-400 mb-0.5">RMA Case Number</div>
                    <span className="text-xs text-purple-700 font-semibold">{t.rmaCaseNumber || 'Pending'}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Assessment</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Remote fix possible?', val: t.couldBeDoneRemotely },
                    { label: 'Revisit needed?', val: t.isRevisitNeeded },
                    { label: 'Customer updated?', val: t.customerUpdated },
                    { label: 'Could be avoided?', val: t.couldHaveBeenAvoided },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-white rounded-md border border-slate-200 p-2">
                      <div className="text-[10px] text-slate-400 mb-1">{label}</div>
                      <BoolDisplay val={val as boolean | null} />
                    </div>
                  ))}
                </div>
                {t.couldHaveBeenAvoided && t.avoidedDetails && (
                  <div>
                    <div className="text-[10px] text-slate-400 mb-0.5">Avoidance Details</div>
                    <p className="text-xs text-slate-600 italic">{t.avoidedDetails}</p>
                  </div>
                )}
                <div>
                  <div className="text-[10px] text-slate-400 mb-0.5">Next Steps</div>
                  <p className="text-xs text-slate-700">{t.nextSteps || <span className="text-slate-300 italic">Not set</span>}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function TruckRollCenter() {
  const [filter, setFilter] = useState('');

  const filtered = filter ? truckRolls.filter(t => t.status === filter) : truckRolls;
  const statuses = ['Scheduled', 'In Progress', 'Completed', 'Revisit Required', 'Pending Approval', 'Closed'];
  const counts = statuses.reduce((acc, s) => ({ ...acc, [s]: truckRolls.filter(t => t.status === s).length }), {} as Record<string, number>);

  const missingCount = truckRolls.filter(t => !t.customerUpdated && t.status === 'Completed').length;
  // revisitStatusCount = records whose current status IS "Revisit Required"
  const revisitStatusCount = truckRolls.filter(t => t.status === 'Revisit Required').length;
  // revisitFlaggedCount = records where the revisitRequired boolean flag is true (identified as needing a revisit)
  const revisitFlaggedCount = truckRolls.filter(t => t.revisitRequired).length;

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Truck Roll Center</h1>
        <p className="text-xs text-slate-400 mt-0.5">Teamwide · {truckRolls.length} total truck rolls</p>
      </div>

      {/* Alerts */}
      {(missingCount > 0 || revisitStatusCount > 0 || revisitFlaggedCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {missingCount > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 ring-1 ring-orange-200 rounded-md px-3 py-2 text-xs text-orange-700">
              <AlertCircle size={13} className="flex-shrink-0" />
              <span><strong>{missingCount}</strong> completed truck roll{missingCount > 1 ? 's' : ''} — customer not updated</span>
            </div>
          )}
          {revisitStatusCount > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 ring-1 ring-orange-200 rounded-md px-3 py-2 text-xs text-orange-700">
              <AlertCircle size={13} className="flex-shrink-0" />
              <span><strong>{revisitStatusCount}</strong> truck roll{revisitStatusCount > 1 ? 's' : ''} currently in <strong>Revisit Required</strong> status</span>
            </div>
          )}
          {revisitFlaggedCount > revisitStatusCount && (
            <div className="flex items-center gap-2 bg-amber-50 ring-1 ring-amber-200 rounded-md px-3 py-2 text-xs text-amber-700">
              <AlertCircle size={13} className="flex-shrink-0" />
              <span><strong>{revisitFlaggedCount}</strong> truck roll{revisitFlaggedCount > 1 ? 's' : ''} identified as needing a revisit (revisit flag)</span>
            </div>
          )}
        </div>
      )}

      {/* Status filters */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter('')}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === '' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          All ({truckRolls.length})
        </button>
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s === filter ? '' : s)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === s ? 'bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {s} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px] table-sticky">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Customer', 'Issue Type', 'Technician', 'Visit Date', 'Status', 'Revisit', 'RMA', 'Cust. Updated', 'Case', ''].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => <TruckRollRow key={t.id} t={t} />)}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No truck rolls match this filter.</div>
        )}
      </div>
    </div>
  );
}
