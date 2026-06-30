import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle, AlertTriangle, Package,
  ChevronDown, ChevronUp, Calendar, RotateCcw, Search,
} from 'lucide-react';
import {
  truckRollRecords,
  type TruckRollRecord,
  type TRStatus,
  type RMAStatus,
  trDaysOpen, trIsOverdue, trIsCritical, trIsOpen, trCompletedThisMonth,
  hasActiveRMA, hasPendingDefectiveReturn, outstandingReimbursement,
  trAgingBucket,
} from '../data/truckRollData';

// ── Status Badges ─────────────────────────────────────────────────────────────

const TR_STATUS_CLS: Partial<Record<TRStatus, string>> = {
  'New':                         'bg-slate-100 text-slate-600 ring-slate-200',
  'Needs Review':                'bg-slate-100 text-slate-700 ring-slate-200',
  'Customer Contact Required':   'bg-amber-50 text-amber-700 ring-amber-200',
  'Awaiting Customer Scheduling':'bg-amber-50 text-amber-700 ring-amber-200',
  'Awaiting Customer Confirmation':'bg-amber-50 text-amber-700 ring-amber-200',
  'Scheduled':                   'bg-blue-50 text-blue-700 ring-blue-200',
  'Awaiting Technician':         'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'Technician En Route':         'bg-indigo-50 text-indigo-800 ring-indigo-200',
  'Pending Approval':            'bg-violet-50 text-violet-700 ring-violet-200',
  'Visit Completed':             'bg-violet-50 text-violet-700 ring-violet-200',
  'Troubleshooting in Progress': 'bg-orange-50 text-orange-700 ring-orange-200',
  'Awaiting Parts':              'bg-yellow-50 text-yellow-800 ring-yellow-200',
  'Awaiting RMA Approval':       'bg-yellow-50 text-yellow-800 ring-yellow-200',
  'RMA Submitted':               'bg-purple-50 text-purple-700 ring-purple-200',
  'RMA Approved':                'bg-purple-50 text-purple-800 ring-purple-200',
  'Replacement Shipped':         'bg-blue-50 text-blue-700 ring-blue-200',
  'Replacement Received':        'bg-blue-50 text-blue-800 ring-blue-200',
  'Return Visit Required':       'bg-red-50 text-red-700 ring-red-200',
  'Revisit Scheduled':           'bg-orange-50 text-orange-700 ring-orange-200',
  'Completed':                   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Cancelled':                   'bg-slate-100 text-slate-500 ring-slate-200',
  'Unable to Complete':          'bg-red-50 text-red-600 ring-red-200',
};

function TRStatusBadge({ status }: { status: TRStatus }) {
  const cls = TR_STATUS_CLS[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium ring-1 whitespace-nowrap ${cls}`}>{status}</span>;
}

const RMA_STATUS_CLS: Partial<Record<RMAStatus, string>> = {
  'Not Required':                         'bg-slate-100 text-slate-400 ring-slate-200',
  'Under Review':                         'bg-amber-50 text-amber-700 ring-amber-200',
  'Case Opened':                          'bg-amber-50 text-amber-700 ring-amber-200',
  'Awaiting Enphase Response':            'bg-yellow-50 text-yellow-800 ring-yellow-200',
  'RMA Submitted':                        'bg-blue-50 text-blue-700 ring-blue-200',
  'RMA Approved':                         'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'RMA Denied':                           'bg-red-50 text-red-700 ring-red-200',
  'Replacement Processing':               'bg-violet-50 text-violet-700 ring-violet-200',
  'Replacement Shipped':                  'bg-blue-50 text-blue-700 ring-blue-200',
  'Replacement Delivered':                'bg-teal-50 text-teal-700 ring-teal-200',
  'Replacement Installed':                'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Defective Equipment Return Pending':   'bg-orange-50 text-orange-700 ring-orange-200',
  'Defective Equipment Returned':         'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Labor Reimbursement Submitted':        'bg-blue-50 text-blue-600 ring-blue-200',
  'Labor Reimbursement Pending':          'bg-yellow-50 text-yellow-800 ring-yellow-200',
  'Labor Reimbursement Partially Received':'bg-orange-50 text-orange-700 ring-orange-200',
  'Labor Reimbursement Received':         'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'RMA Closed':                           'bg-slate-100 text-slate-500 ring-slate-200',
};

function RMAStatusBadge({ status }: { status: RMAStatus }) {
  const cls = RMA_STATUS_CLS[status] ?? 'bg-slate-100 text-slate-500 ring-slate-200';
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium ring-1 whitespace-nowrap ${cls}`}>{status}</span>;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent ?? 'text-slate-800'}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

function AgingChip({ days, isOverdue: over, isCritical: crit }: { days: number; isOverdue: boolean; isCritical: boolean }) {
  if (crit)  return <span className="text-[10px] font-semibold text-red-700 bg-red-50 ring-1 ring-red-200 px-1.5 py-0.5 rounded">{days}d ⚠</span>;
  if (over)  return <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 ring-1 ring-orange-200 px-1.5 py-0.5 rounded">{days}d</span>;
  return <span className="text-[10px] text-slate-500 bg-slate-50 ring-1 ring-slate-200 px-1.5 py-0.5 rounded">{days}d</span>;
}

// ── Expanded row (shared across tabs) ────────────────────────────────────────

function ExpandedTRRow({ t, colSpan }: { t: TruckRollRecord; colSpan: number }) {
  return (
    <tr className="bg-slate-50/80 border-b border-slate-100">
      <td colSpan={colSpan} className="px-5 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Contact & Site</h4>
            <div className="space-y-1 text-xs text-slate-600">
              <div><span className="text-slate-400">Phone: </span>{t.customerPhone}</div>
              <div><span className="text-slate-400">Address: </span>{t.customerAddress}</div>
              <div><span className="text-slate-400">Access: </span>{t.siteAccessType}{t.accessInstructions ? ` — ${t.accessInstructions}` : ''}</div>
              {t.ladderRequired && <div className="text-amber-600 text-[10px] font-medium">⚑ Ladder required</div>}
              {t.specialEquipmentRequired && <div><span className="text-slate-400">Equipment: </span>{t.specialEquipmentRequired}</div>}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">System & Monitoring</h4>
            <div className="space-y-1 text-xs text-slate-600">
              <div><span className="text-slate-400">System: </span>{t.systemName}</div>
              <div><span className="text-slate-400">Platform: </span>{t.monitoringPlatform}</div>
              <div><span className="text-slate-400">Monitor status: </span>{t.currentMonitoringStatus}</div>
              <div><span className="text-slate-400">Gateway: </span>{t.gatewayStatus}</div>
              {t.previousTruckRollCount > 0 && <div className="text-orange-600 text-[10px] font-medium">⚑ {t.previousTruckRollCount} prior truck roll(s)</div>}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Reason & Next Steps</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{t.truckRollReason}</p>
            {t.nextSteps && (
              <>
                <div className="text-[10px] text-slate-400">Next Steps</div>
                <p className="text-xs text-slate-600 leading-relaxed">{t.nextSteps}</p>
              </>
            )}
          </div>
        </div>

        {t.rmas.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">RMAs</h4>
            <div className="space-y-1">
              {t.rmas.map(r => {
                const owed = outstandingReimbursement(r);
                return (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 text-xs bg-white border border-slate-200 rounded-md px-3 py-2">
                    <span className="font-semibold text-purple-700">{r.rmaNumber}</span>
                    <RMAStatusBadge status={r.rmaStatus} />
                    {r.projectedReimbursementAmount > 0 && (
                      <span className="text-slate-500">
                        Reimb: <span className="font-medium text-slate-700">${r.totalReimbursementReceived}</span> / ${r.projectedReimbursementAmount}
                        {owed > 0 && <span className="text-orange-600 font-medium ml-1">(${owed} owed)</span>}
                      </span>
                    )}
                    {r.returnedDefectiveRMA !== 'Not Required' && (
                      <span className="text-slate-500">Return: <span className={r.returnedDefectiveRMA === 'Overdue' ? 'text-red-600 font-medium' : r.returnedDefectiveRMA === 'Pending' ? 'text-orange-600 font-medium' : 'text-emerald-600 font-medium'}>{r.returnedDefectiveRMA}</span></span>
                    )}
                    {r.rmaNote && <span className="text-slate-400 italic text-[10px]">{r.rmaNote}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {t.enphaseCases.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Enphase Cases</h4>
            <div className="space-y-1">
              {t.enphaseCases.map(ec => (
                <div key={ec.id} className="flex flex-wrap items-center gap-3 text-xs bg-white border border-slate-200 rounded-md px-3 py-2">
                  <span className="font-semibold text-blue-700">{ec.enphaseCaseNumber}</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 ring-1 ring-blue-200 px-1.5 py-0.5 rounded">{ec.caseStatus}</span>
                  <span className="text-slate-400">Opened: {ec.openedDate} · Updated: {ec.lastUpdatedDate}</span>
                  <span className="text-slate-500 italic text-[10px]">{ec.caseNotes}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {t.activityHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Recent Activity</h4>
            <div className="space-y-1">
              {[...t.activityHistory].reverse().slice(0, 4).map(a => (
                <div key={a.id} className="flex gap-2 text-xs text-slate-600">
                  <span className="text-slate-400 shrink-0 w-20">{a.date}</span>
                  <span className="font-medium text-slate-700 shrink-0 w-28 truncate">{a.author}</span>
                  <span className="font-medium shrink-0">{a.event}:</span>
                  <span className="text-slate-400 truncate">{a.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ records }: { records: TruckRollRecord[] }) {
  const open        = records.filter(trIsOpen);
  const overdue     = records.filter(trIsOverdue);
  const critical    = records.filter(trIsCritical);
  const completedMo = records.filter(trCompletedThisMonth);
  const pendingRet  = records.filter(hasPendingDefectiveReturn);
  const awaitingSched = open.filter(t =>
    t.status === 'Awaiting Customer Scheduling' || t.status === 'New' ||
    t.status === 'Customer Contact Required'    || t.status === 'Awaiting Customer Confirmation'
  );
  const scheduled   = open.filter(t => t.status === 'Scheduled' || t.status === 'Revisit Scheduled');
  const awaitParts  = open.filter(t => t.status === 'Awaiting Parts');
  const withRMA     = records.filter(hasActiveRMA);

  const buckets: Record<string, number> = {
    '0–7 Days': 0, '8–14 Days': 0, '15–21 Days': 0, '22–30 Days': 0, '30+ Days': 0,
  };
  open.forEach(t => { const b = trAgingBucket(t); buckets[b] = (buckets[b] ?? 0) + 1; });
  const maxBkt = Math.max(...Object.values(buckets), 1);

  const byCategory: Record<string, number> = {};
  open.forEach(t => { byCategory[t.issueCategory] = (byCategory[t.issueCategory] ?? 0) + 1; });

  const totalOutstanding = records.reduce(
    (sum, t) => sum + t.rmas.reduce((s, r) => s + outstandingReimbursement(r), 0), 0
  );

  return (
    <div className="space-y-5">
      {(critical.length > 0 || overdue.length > 0 || pendingRet.length > 0) && (
        <div className="space-y-2">
          {critical.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 ring-1 ring-red-200 rounded-lg px-4 py-2.5 text-xs text-red-700">
              <AlertCircle size={14} className="shrink-0" />
              <strong>{critical.length}</strong> truck roll{critical.length > 1 ? 's are' : ' is'} CRITICAL — open 30+ days with no resolution
            </div>
          )}
          {overdue.length > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 ring-1 ring-orange-200 rounded-lg px-4 py-2.5 text-xs text-orange-700">
              <AlertTriangle size={14} className="shrink-0" />
              <strong>{overdue.length}</strong> truck roll{overdue.length > 1 ? 's are' : ' is'} overdue — GNR past 14 days or other issues past 21 days
            </div>
          )}
          {pendingRet.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 ring-1 ring-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-700">
              <Package size={14} className="shrink-0" />
              <strong>{pendingRet.length}</strong> defective equipment return{pendingRet.length > 1 ? 's' : ''} pending
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPICard label="Total Open"       value={open.length} />
        <KPICard label="Needs Scheduling" value={awaitingSched.length} accent={awaitingSched.length > 0 ? 'text-amber-700' : undefined} />
        <KPICard label="Scheduled"        value={scheduled.length}    accent="text-blue-700" />
        <KPICard label="Awaiting Parts"   value={awaitParts.length}   accent={awaitParts.length > 0 ? 'text-yellow-700' : undefined} />
        <KPICard label="Active RMAs"      value={withRMA.length}      accent={withRMA.length > 0 ? 'text-purple-700' : undefined} />
        <KPICard label="Overdue"          value={overdue.length}      accent={overdue.length > 0 ? 'text-orange-700' : undefined} />
        <KPICard label="Critical"         value={critical.length}     accent={critical.length > 0 ? 'text-red-700' : undefined} />
        <KPICard label="Completed (Jun)"  value={completedMo.length}  accent="text-emerald-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Open TR Aging</h3>
          <div className="space-y-2">
            {Object.entries(buckets).map(([label, count]) => {
              const pct = (count / maxBkt) * 100;
              const barCls = label === '30+ Days' ? 'bg-red-500' : label === '22–30 Days' ? 'bg-orange-400' : label === '15–21 Days' ? 'bg-yellow-400' : 'bg-blue-400';
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className="text-[10px] text-slate-500 w-20 shrink-0">{label}</div>
                  <div className="flex-1 h-4 bg-slate-100 rounded-sm overflow-hidden">
                    <div className={`h-full ${barCls} rounded-sm`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-700 w-4 text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Open by Issue Type</h3>
          <div className="space-y-2">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
              const pct = open.length > 0 ? (count / open.length) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-2">
                  <div className="text-[10px] text-slate-500 w-36 shrink-0 truncate">{cat}</div>
                  <div className="flex-1 h-4 bg-slate-100 rounded-sm overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-sm" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-700 w-4 text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {(totalOutstanding > 0 || pendingRet.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {totalOutstanding > 0 && (
            <KPICard
              label="Outstanding Reimbursement"
              value={`$${totalOutstanding.toLocaleString()}`}
              sub={`Owed from Enphase across ${records.filter(t => t.rmas.some(r => outstandingReimbursement(r) > 0)).length} records`}
              accent="text-orange-700"
            />
          )}
          {pendingRet.length > 0 && (
            <KPICard
              label="Defective Returns Pending"
              value={pendingRet.length}
              sub="Defective units awaiting return to Enphase"
              accent="text-orange-700"
            />
          )}
        </div>
      )}

      {(critical.length > 0 || overdue.filter(t => !trIsCritical(t)).length > 0) && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-700">Needs Immediate Attention</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {[...critical, ...overdue.filter(t => !trIsCritical(t))].slice(0, 8).map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800">{t.customerName}</div>
                  <div className="text-[10px] text-slate-400">{t.id} · {t.issueCategory}</div>
                </div>
                <TRStatusBadge status={t.status} />
                <AgingChip days={trDaysOpen(t)} isOverdue={trIsOverdue(t)} isCritical={trIsCritical(t)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── All Truck Rolls Tab ───────────────────────────────────────────────────────

function TRRow({ t }: { t: TruckRollRecord }) {
  const [expanded, setExpanded] = useState(false);
  const days  = trDaysOpen(t);
  const over  = trIsOverdue(t);
  const crit  = trIsCritical(t);
  return (
    <>
      <tr
        className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${crit ? 'bg-red-50/20' : over ? 'bg-orange-50/20' : ''}`}
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-3 py-2.5">
          <div className="text-xs font-medium text-slate-800">{t.customerName}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{t.id}</div>
        </td>
        <td className="px-3 py-2.5 text-[10px] text-slate-500 whitespace-nowrap">{t.issueCategory}</td>
        <td className="px-3 py-2.5"><TRStatusBadge status={t.status} /></td>
        <td className="px-3 py-2.5 text-[10px] text-slate-500 whitespace-nowrap">{t.assignedTechnician || <span className="text-slate-300">—</span>}</td>
        <td className="px-3 py-2.5 text-[10px] text-slate-500 whitespace-nowrap">{t.scheduledVisitDate || <span className="text-slate-300">—</span>}</td>
        <td className="px-3 py-2.5"><AgingChip days={days} isOverdue={over} isCritical={crit} /></td>
        <td className="px-3 py-2.5">
          {hasActiveRMA(t) && <span className="text-[10px] text-purple-700 bg-purple-50 ring-1 ring-purple-200 px-1.5 py-0.5 rounded">RMA</span>}
        </td>
        <td className="px-3 py-2.5 text-center">
          {expanded ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
        </td>
      </tr>
      {expanded && <ExpandedTRRow t={t} colSpan={8} />}
    </>
  );
}

function AllTruckRollsTab({ records }: { records: TruckRollRecord[] }) {
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [catFilter, setCat]         = useState('');
  const [overdueOnly, setOverdue]   = useState(false);

  const filtered = records.filter(t => {
    if (search && !t.customerName.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (catFilter && t.issueCategory !== catFilter) return false;
    if (overdueOnly && !trIsOverdue(t)) return false;
    return true;
  });

  const allStatuses  = [...new Set(records.map(t => t.status))].sort();
  const allCats      = [...new Set(records.map(t => t.issueCategory))].sort();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer or ID…"
            className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-300 w-52"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-600 focus:outline-none">
          <option value="">All Statuses</option>
          {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={catFilter} onChange={e => setCat(e.target.value)} className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-600 focus:outline-none">
          <option value="">All Issue Types</option>
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setOverdue(v => !v)}
          className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${overdueOnly ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          Overdue Only
        </button>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} of {records.length}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Customer', 'Issue Type', 'Status', 'Technician', 'Scheduled', 'Age', 'RMA', ''].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => <TRRow key={t.id} t={t} />)}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No truck rolls match these filters.</div>}
      </div>
    </div>
  );
}

// ── Scheduling Tab ────────────────────────────────────────────────────────────

function SchedulingTab({ records }: { records: TruckRollRecord[] }) {
  const needsSched = records.filter(t =>
    trIsOpen(t) && (
      t.status === 'Awaiting Customer Scheduling' ||
      t.status === 'New' ||
      t.status === 'Customer Contact Required' ||
      t.status === 'Awaiting Customer Confirmation'
    )
  );
  const upcoming = records
    .filter(t => t.scheduledVisitDate && t.status === 'Scheduled')
    .sort((a, b) => a.scheduledVisitDate.localeCompare(b.scheduledVisitDate));
  const revisits = records
    .filter(t => t.status === 'Revisit Scheduled' && t.revisitScheduledDate)
    .sort((a, b) => a.revisitScheduledDate.localeCompare(b.revisitScheduledDate));
  const awaitParts = records.filter(t => t.status === 'Awaiting Parts');

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <Calendar size={14} className="text-blue-500" />
          <h3 className="text-xs font-semibold text-slate-700">Upcoming Scheduled Visits ({upcoming.length})</h3>
        </div>
        {upcoming.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {upcoming.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="text-[10px] font-semibold text-blue-700 bg-blue-50 ring-1 ring-blue-200 px-2 py-1 rounded w-24 text-center shrink-0">{t.scheduledVisitDate}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800">{t.customerName}</div>
                  <div className="text-[10px] text-slate-400">{t.id} · {t.issueCategory} · {t.customerAddress}</div>
                </div>
                <div className="text-[10px] text-slate-500 shrink-0">{t.assignedTechnician || 'Unassigned'}</div>
                <TRStatusBadge status={t.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs">No visits scheduled.</div>
        )}
      </div>

      {revisits.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <RotateCcw size={14} className="text-orange-500" />
            <h3 className="text-xs font-semibold text-slate-700">Revisit Appointments ({revisits.length})</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {revisits.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="text-[10px] font-semibold text-orange-700 bg-orange-50 ring-1 ring-orange-200 px-2 py-1 rounded w-24 text-center shrink-0">{t.revisitScheduledDate}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800">{t.customerName}</div>
                  <div className="text-[10px] text-slate-400">{t.id} · {t.revisitReason}</div>
                </div>
                <div className="text-[10px] text-slate-500 shrink-0">{t.assignedTechnician || 'Unassigned'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <AlertTriangle size={14} className="text-amber-500" />
          <h3 className="text-xs font-semibold text-slate-700">Needs Scheduling ({needsSched.length})</h3>
        </div>
        {needsSched.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {needsSched.map(t => {
              const over = trIsOverdue(t);
              return (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 ${over ? 'bg-orange-50/20' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-800">{t.customerName}</div>
                    <div className="text-[10px] text-slate-400">{t.id} · {t.issueCategory}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Last contact: {t.lastCustomerContactDate || 'None'} · Follow-up: {t.nextFollowUpDate || '—'}
                    </div>
                  </div>
                  <TRStatusBadge status={t.status} />
                  <AgingChip days={trDaysOpen(t)} isOverdue={over} isCritical={trIsCritical(t)} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-emerald-500 text-xs font-medium">All cases are past the scheduling stage.</div>
        )}
      </div>

      {awaitParts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <Package size={14} className="text-yellow-600" />
            <h3 className="text-xs font-semibold text-slate-700">Awaiting Parts / Delivery ({awaitParts.length})</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {awaitParts.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800">{t.customerName}</div>
                  <div className="text-[10px] text-slate-400">{t.id} · {t.issueCategory}</div>
                  {t.estimatedDeliveryDate && <div className="text-[10px] text-yellow-700 mt-0.5">Est. delivery: {t.estimatedDeliveryDate}</div>}
                  {t.revisitScheduledDate  && <div className="text-[10px] text-blue-600 mt-0.5">Revisit: {t.revisitScheduledDate}</div>}
                </div>
                <TRStatusBadge status={t.status} />
                <AgingChip days={trDaysOpen(t)} isOverdue={trIsOverdue(t)} isCritical={trIsCritical(t)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Enphase Cases & RMAs Tab ──────────────────────────────────────────────────

function EnphaseTab({ records }: { records: TruckRollRecord[] }) {
  const withCases = records.filter(t => t.enphaseCases.length > 0);
  const withRMAs  = records.filter(t => t.rmas.length > 0);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-700">Enphase Support Cases ({withCases.length} records)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Customer / TR', 'Enphase Case #', 'Status', 'Opened', 'Updated', 'Notes'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withCases.flatMap(t =>
                t.enphaseCases.map(ec => (
                  <tr key={`${t.id}-${ec.id}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium text-slate-800">{t.customerName}</div>
                      <div className="text-[10px] text-slate-400">{t.id}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-blue-700">{ec.enphaseCaseNumber}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] bg-blue-50 text-blue-700 ring-1 ring-blue-200 px-1.5 py-0.5 rounded">{ec.caseStatus}</span></td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500">{ec.openedDate}</td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500">{ec.lastUpdatedDate}</td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-400 italic max-w-xs truncate">{ec.caseNotes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-700">
            RMA Records ({withRMAs.reduce((s, t) => s + t.rmas.length, 0)} total)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Customer / TR', 'RMA #', 'Enphase Case', 'RMA Status', 'Submitted', 'Tracking', 'Reimbursement', 'Return'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withRMAs.flatMap(t =>
                t.rmas.map(r => {
                  const owed = outstandingReimbursement(r);
                  return (
                    <tr key={`${t.id}-${r.id}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <div className="text-xs font-medium text-slate-800">{t.customerName}</div>
                        <div className="text-[10px] text-slate-400">{t.id}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-semibold text-purple-700">{r.rmaNumber}</td>
                      <td className="px-3 py-2.5 text-[10px] text-blue-700">{r.enphaseCaseNumber}</td>
                      <td className="px-3 py-2.5"><RMAStatusBadge status={r.rmaStatus} /></td>
                      <td className="px-3 py-2.5 text-[10px] text-slate-500">{r.rmaSubmittedDate || '—'}</td>
                      <td className="px-3 py-2.5 text-[10px] text-slate-500">{r.trackingNumber || <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-2.5 text-[10px]">
                        {r.projectedReimbursementAmount > 0 ? (
                          <>
                            <span className="text-emerald-700">${r.totalReimbursementReceived}</span>
                            <span className="text-slate-400"> / ${r.projectedReimbursementAmount}</span>
                            {owed > 0 && <span className="text-orange-600 font-medium ml-1">(${owed} owed)</span>}
                          </>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium">
                        {r.returnedDefectiveRMA === 'Not Required' ? <span className="text-slate-300">—</span>
                          : r.returnedDefectiveRMA === 'Overdue' ? <span className="text-red-600">Overdue</span>
                          : r.returnedDefectiveRMA === 'Pending' ? <span className="text-orange-600">Pending</span>
                          : r.returnedDefectiveRMA === 'Yes'     ? <span className="text-emerald-600">Returned</span>
                          : <span className="text-slate-500">{r.returnedDefectiveRMA}</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Reimbursements Tab ────────────────────────────────────────────────────────

function ReimbursementsTab({ records }: { records: TruckRollRecord[] }) {
  const allRMAs   = records.flatMap(t => t.rmas.map(r => ({ ...r, _t: t })));
  const withReimb = allRMAs.filter(r => r.projectedReimbursementAmount > 0);

  const totalProjected   = withReimb.reduce((s, r) => s + r.projectedReimbursementAmount, 0);
  const totalReceived    = withReimb.reduce((s, r) => s + r.totalReimbursementReceived, 0);
  const totalOutstanding = totalProjected - totalReceived;
  const notSubmitted     = withReimb.filter(r => r.laborReimbursementStatus === 'Not Submitted');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Total Projected"  value={`$${totalProjected.toLocaleString()}`} />
        <KPICard label="Total Received"   value={`$${totalReceived.toLocaleString()}`}   accent="text-emerald-700" />
        <KPICard label="Outstanding"      value={`$${totalOutstanding.toLocaleString()}`} accent={totalOutstanding > 0 ? 'text-orange-700' : undefined} />
        <KPICard label="Not Yet Submitted" value={notSubmitted.length} sub="RMA records" accent={notSubmitted.length > 0 ? 'text-amber-700' : undefined} />
      </div>

      {notSubmitted.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-amber-800 mb-2">Action Required — Not Yet Submitted ({notSubmitted.length})</h3>
          <div className="space-y-1">
            {notSubmitted.map(r => (
              <div key={r.id} className="flex items-center gap-2 text-xs text-amber-700">
                <span className="font-semibold">{r._t.customerName}</span>
                <span className="text-amber-500">({r.rmaNumber})</span>
                <span>— ${r.projectedReimbursementAmount} eligible</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-700">All Reimbursement Records ({withReimb.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Customer / TR', 'RMA #', 'Labor Status', 'Projected', 'Received', 'Outstanding', 'Submitted', 'Recd Date'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withReimb.map(r => {
                const owed = outstandingReimbursement(r);
                return (
                  <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 ${owed > 0 ? 'bg-orange-50/10' : ''}`}>
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium text-slate-800">{r._t.customerName}</div>
                      <div className="text-[10px] text-slate-400">{r._t.id}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-purple-700">{r.rmaNumber}</td>
                    <td className="px-3 py-2.5 text-[10px] font-medium">
                      <span className={
                        r.laborReimbursementStatus === 'Fully Received'      ? 'text-emerald-700' :
                        r.laborReimbursementStatus === 'Partially Received'  ? 'text-orange-600'  :
                        r.laborReimbursementStatus === 'Not Submitted'       ? 'text-amber-700'   :
                        'text-blue-600'
                      }>{r.laborReimbursementStatus}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-slate-700">${r.projectedReimbursementAmount}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-emerald-700">${r.totalReimbursementReceived}</td>
                    <td className={`px-3 py-2.5 text-xs font-semibold ${owed > 0 ? 'text-orange-700' : 'text-slate-400'}`}>{owed > 0 ? `$${owed}` : '—'}</td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500">{r.laborSubmittedDate || '—'}</td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500">{r.reimbursementDateReceived || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Equipment Returns Tab ─────────────────────────────────────────────────────

function EquipmentReturnsTab({ records }: { records: TruckRollRecord[] }) {
  const allRMAs = records.flatMap(t => t.rmas.map(r => ({ ...r, _t: t })));
  const needReturn = allRMAs.filter(r => r.returnedDefectiveRMA !== 'Not Required');
  const overdue    = needReturn.filter(r => r.returnedDefectiveRMA === 'Overdue');
  const pending    = needReturn.filter(r => r.returnedDefectiveRMA === 'Pending');
  const done       = needReturn.filter(r => r.returnedDefectiveRMA === 'Yes');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <KPICard label="Overdue Returns"    value={overdue.length} accent={overdue.length > 0 ? 'text-red-700' : undefined} />
        <KPICard label="Pending Returns"    value={pending.length} accent={pending.length > 0 ? 'text-orange-700' : undefined} />
        <KPICard label="Completed Returns"  value={done.length}    accent="text-emerald-700" />
      </div>

      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-red-200">
            <h3 className="text-xs font-semibold text-red-800">Overdue Returns — Action Required ({overdue.length})</h3>
          </div>
          <div className="divide-y divide-red-100">
            {overdue.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-red-800">{r._t.customerName}</div>
                  <div className="text-[10px] text-red-600">{r._t.id} · {r.rmaNumber}</div>
                </div>
                <span className="text-[10px] font-semibold text-red-700 bg-red-100 ring-1 ring-red-300 px-2 py-0.5 rounded">OVERDUE</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-700">All Equipment Return Records ({needReturn.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Customer / TR', 'RMA #', 'Return Status', 'Return Date', 'Tracking #'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {needReturn.map(r => (
                <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 ${r.returnedDefectiveRMA === 'Overdue' ? 'bg-red-50/20' : r.returnedDefectiveRMA === 'Pending' ? 'bg-orange-50/20' : ''}`}>
                  <td className="px-3 py-2.5">
                    <div className="text-xs font-medium text-slate-800">{r._t.customerName}</div>
                    <div className="text-[10px] text-slate-400">{r._t.id}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-purple-700">{r.rmaNumber}</td>
                  <td className="px-3 py-2.5 text-[10px] font-semibold">
                    {r.returnedDefectiveRMA === 'Overdue' ? <span className="text-red-600">Overdue</span>
                      : r.returnedDefectiveRMA === 'Pending' ? <span className="text-orange-600">Pending</span>
                      : r.returnedDefectiveRMA === 'Yes' ? <span className="text-emerald-600">Returned</span>
                      : <span className="text-slate-500">{r.returnedDefectiveRMA}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-500">{r.defectiveRMAReturnDate || '—'}</td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-500">{r.defectiveRMAReturnTracking || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Completed Tab ─────────────────────────────────────────────────────────────

function CompletedTab({ records }: { records: TruckRollRecord[] }) {
  const completed     = records.filter(t => t.status === 'Completed' || t.status === 'Cancelled');
  const completedOnly = completed.filter(t => t.status === 'Completed');
  const thisMonth     = completedOnly.filter(trCompletedThisMonth);
  const repeats       = completedOnly.filter(t => t.previousTruckRollCount > 0);
  const avgDays       = completedOnly.length > 0
    ? Math.round(completedOnly.reduce((s, t) => s + trDaysOpen(t), 0) / completedOnly.length)
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Total Completed"       value={completedOnly.length} accent="text-emerald-700" />
        <KPICard label="Completed This Month"  value={thisMonth.length}     accent="text-emerald-700" />
        <KPICard label="Avg Days to Complete"  value={avgDays}              sub="across all completed" />
        <KPICard label="Repeat Issues"         value={repeats.length}       accent={repeats.length > 0 ? 'text-orange-700' : undefined} sub="had prior truck rolls" />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-700">Completed Records ({completed.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Customer / TR', 'Issue Type', 'Completed', 'Days Open', 'Technician', 'Status', 'RMA', 'Repeat'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completed.map(t => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <div className="text-xs font-medium text-slate-800">{t.customerName}</div>
                    <div className="text-[10px] text-slate-400">{t.id}</div>
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-500">{t.issueCategory}</td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-500">{t.completionDate || '—'}</td>
                  <td className="px-3 py-2.5 text-[10px] font-semibold text-slate-700">{trDaysOpen(t)}d</td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-500">{t.assignedTechnician || '—'}</td>
                  <td className="px-3 py-2.5"><TRStatusBadge status={t.status} /></td>
                  <td className="px-3 py-2.5 text-[10px]">
                    {hasActiveRMA(t)   ? <span className="text-purple-700 font-medium">Active</span>
                      : t.rmas.length  ? <span className="text-emerald-600 font-medium">Closed</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[10px]">
                    {t.previousTruckRollCount > 0
                      ? <span className="text-orange-600 font-semibold">#{t.previousTruckRollCount + 1}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {completed.length === 0 && <div className="py-6 text-center text-slate-400 text-xs">No completed truck rolls.</div>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',        label: 'Overview' },
  { key: 'all',             label: 'All Truck Rolls' },
  { key: 'scheduling',      label: 'Scheduling' },
  { key: 'enphase',         label: 'Enphase Cases & RMAs' },
  { key: 'reimbursements',  label: 'Reimbursements' },
  { key: 'equipment',       label: 'Equipment Returns' },
  { key: 'completed',       label: 'Completed' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function TruckRollCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') ?? 'overview') as TabKey;
  const setTab = (key: TabKey) => setSearchParams({ tab: key }, { replace: true });

  const records  = truckRollRecords;
  const open     = records.filter(trIsOpen);
  const overdue  = records.filter(trIsOverdue);
  const critical = records.filter(trIsCritical);

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Truck Roll Center</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Teamwide · {records.length} total · {open.length} open
          {overdue.length  > 0 && <span className="text-orange-600 font-medium ml-2">· {overdue.length} overdue</span>}
          {critical.length > 0 && <span className="text-red-600 font-medium ml-1">· {critical.length} critical</span>}
        </p>
      </div>

      <div className="flex flex-wrap border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px whitespace-nowrap transition-colors
              ${activeTab === tab.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview'       && <OverviewTab        records={records} />}
      {activeTab === 'all'            && <AllTruckRollsTab   records={records} />}
      {activeTab === 'scheduling'     && <SchedulingTab      records={records} />}
      {activeTab === 'enphase'        && <EnphaseTab         records={records} />}
      {activeTab === 'reimbursements' && <ReimbursementsTab  records={records} />}
      {activeTab === 'equipment'      && <EquipmentReturnsTab records={records} />}
      {activeTab === 'completed'      && <CompletedTab       records={records} />}
    </div>
  );
}
