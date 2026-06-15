import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { truckRolls } from '../data/sampleData';

type TruckRollStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Pending Approval' | 'Revisit Required' | 'Closed';

const STATUS_COLORS: Record<TruckRollStatus, string> = {
  Scheduled: 'bg-blue-100 text-blue-700 border border-blue-200',
  'In Progress': 'bg-blue-100 text-blue-700 border border-blue-200',
  Completed: 'bg-green-100 text-green-700 border border-green-200',
  'Pending Approval': 'bg-purple-100 text-purple-700 border border-purple-200',
  'Revisit Required': 'bg-orange-100 text-orange-700 border border-orange-200',
  Closed: 'bg-slate-100 text-slate-500 border border-slate-200',
};

function BoolDisplay({ val }: { val: boolean | null }) {
  if (val === null) return <span className="text-slate-300 text-xs">TBD</span>;
  return val
    ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle size={12} />Yes</span>
    : <span className="flex items-center gap-1 text-slate-400 text-xs font-medium"><XCircle size={12} />No</span>;
}

function TruckRollRow({ t }: { t: typeof truckRolls[0] }) {
  const [expanded, setExpanded] = useState(false);
  const statusStyle = STATUS_COLORS[t.status] || 'bg-slate-100 text-slate-600';

  return (
    <>
      <tr className="hover:bg-slate-50 border-b border-slate-100 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="px-4 py-3">
          <div className="font-medium text-sm text-slate-800">{t.customerName}</div>
          <div className="text-xs text-slate-400">{t.id}</div>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">{t.issueType}</td>
        <td className="px-4 py-3 text-sm text-slate-600">{t.technician}</td>
        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{t.visitDate}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${statusStyle}`}>{t.status}</span>
        </td>
        <td className="px-4 py-3">
          {t.revisitRequired
            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200"><AlertCircle size={10} />Yes</span>
            : <span className="text-slate-300 text-xs">No</span>}
        </td>
        <td className="px-4 py-3">
          {t.rmaRequired
            ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">Yes</span>
            : <span className="text-slate-300 text-xs">No</span>}
        </td>
        <td className="px-4 py-3">
          <BoolDisplay val={t.customerUpdated} />
        </td>
        <td className="px-4 py-3">
          <Link to={`/cases/${t.caseId}`} className="text-xs text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>{t.caseId}</Link>
        </td>
        <td className="px-4 py-3">
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50 border-b border-slate-100">
          <td colSpan={10} className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {/* Outcome Fields */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 text-xs uppercase tracking-wide">Outcome Details</h3>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Troubleshoot Issue</div>
                  <p className="text-slate-700">{t.troubleshootIssue || <span className="text-slate-300 italic">Not completed</span>}</p>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Outcome Summary</div>
                  <p className="text-slate-700">{t.outcome || <span className="text-slate-300 italic">Not completed</span>}</p>
                </div>
                {t.rmaRequired && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">RMA Case Number</div>
                    <span className="text-purple-700 font-semibold">{t.rmaCaseNumber || 'Pending'}</span>
                  </div>
                )}
              </div>

              {/* Yes/No Fields */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 text-xs uppercase tracking-wide">Assessment</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Could be done remotely?', val: t.couldBeDoneRemotely },
                    { label: 'Revisit needed?', val: t.isRevisitNeeded },
                    { label: 'Customer updated?', val: t.customerUpdated },
                    { label: 'Could have been avoided?', val: t.couldHaveBeenAvoided },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-white rounded-lg border border-slate-200 p-3">
                      <div className="text-xs text-slate-500 mb-1">{label}</div>
                      <BoolDisplay val={val as boolean | null} />
                    </div>
                  ))}
                </div>
                {t.couldHaveBeenAvoided && t.avoidedDetails && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Avoidance Details</div>
                    <p className="text-slate-700 text-xs italic">{t.avoidedDetails}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs text-slate-500 mb-1">Next Steps</div>
                  <p className="text-slate-700">{t.nextSteps || <span className="text-slate-300 italic">Not set</span>}</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Truck Roll Center</h1>
        <p className="text-slate-500 text-sm">{truckRolls.length} total truck rolls</p>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === '' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          All ({truckRolls.length})
        </button>
        {statuses.map(s => {
          const styles: Record<string, string> = {
            Scheduled: 'bg-blue-500 text-white',
            'In Progress': 'bg-blue-400 text-white',
            Completed: 'bg-green-500 text-white',
            'Revisit Required': 'bg-orange-500 text-white',
            'Pending Approval': 'bg-purple-500 text-white',
            Closed: 'bg-slate-400 text-white',
          };
          return (
            <button
              key={s}
              onClick={() => setFilter(s === filter ? '' : s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? styles[s] : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {s} ({counts[s] || 0})
            </button>
          );
        })}
      </div>

      {/* Alerts */}
      {truckRolls.filter(t => !t.customerUpdated && t.status === 'Completed').length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-700">
            <strong>{truckRolls.filter(t => !t.customerUpdated && t.status === 'Completed').length} completed truck roll(s)</strong> have not had the customer updated.
          </p>
        </div>
      )}
      {truckRolls.filter(t => t.revisitRequired && t.status !== 'Closed').length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-700">
            <strong>{truckRolls.filter(t => t.revisitRequired && t.status !== 'Closed').length} truck roll(s)</strong> require a revisit.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Customer', 'Issue Type', 'Technician', 'Visit Date', 'Status', 'Revisit Req.', 'RMA Req.', 'Customer Updated', 'Case', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => <TruckRollRow key={t.id} t={t} />)}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">No truck rolls match this filter.</div>
        )}
      </div>
    </div>
  );
}
