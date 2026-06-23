import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ExternalLink, ChevronUp, ChevronDown, X } from 'lucide-react';
import { cases, truckRolls, OWNERS } from '../data/sampleData';
import type { CaseType, CaseStatus, Priority, WaitingOn } from '../data/sampleData';
import { PriorityBadge, StatusBadge, WaitingBadge, RiskBadge } from '../components/Badge';
import { computeRisk, daysOpen, daysSinceLastUpdate, isOverdue, isDueToday, hasNoRecentUpdate } from '../utils/caseLogic';

const CASE_TYPES: CaseType[] = ['Billing','Production','Gateway Not Reporting','Roof Leak','Collections','Complaint','Utility Issue','PTO Issue','ACH Issue','Cancellation'];
const STATUSES: CaseStatus[] = ['New','In Progress','Waiting on Customer','Waiting on Internal Team','Truck Roll Scheduled','Pending Approval','Revisit Required','Resolved','Closed'];
const PRIORITIES: Priority[] = ['Low','Medium','High','Urgent'];
const WAITING_ON: WaitingOn[] = ['Installer','Warehouse','Engineering','Billing','Utility','Customer','Management','Legal','None'];

type SortKey = 'customerName' | 'caseType' | 'priority' | 'status' | 'dateOpened' | 'nextFollowUp' | 'riskScore';

const QUICK_FILTERS = [
  { key: 'dueToday',     label: 'Due Today' },
  { key: 'overdue',      label: 'Overdue' },
  { key: 'highPriority', label: 'High Priority' },
  { key: 'noUpdate',     label: 'No Update 3d+' },
] as const;

export default function CustomerCases() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterWaiting, setFilterWaiting] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [quickFilter, setQuickFilter] = useState<'' | 'dueToday' | 'overdue' | 'highPriority' | 'noUpdate'>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'riskScore', dir: 'desc' });

  const withRisk = cases.map(c => ({
    c,
    risk: computeRisk(c, truckRolls.find(t => t.id === c.truckRollId)),
  }));

  const filtered = withRisk.filter(({ c }) => {
    const q = search.toLowerCase();
    if (q && !c.customerName.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q) && !c.caseType.toLowerCase().includes(q)) return false;
    if (filterType && c.caseType !== filterType) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    if (filterWaiting && c.waitingOn !== filterWaiting) return false;
    if (filterOwner && c.owner !== filterOwner) return false;
    if (quickFilter === 'dueToday' && !isDueToday(c)) return false;
    if (quickFilter === 'overdue' && !isOverdue(c)) return false;
    if (quickFilter === 'highPriority' && c.priority !== 'High' && c.priority !== 'Urgent') return false;
    if (quickFilter === 'noUpdate' && !hasNoRecentUpdate(c)) return false;
    return true;
  }).sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    if (sort.key === 'riskScore') return (a.risk.score - b.risk.score) * dir;
    const av = a.c[sort.key as keyof typeof a.c] as string;
    const bv = b.c[sort.key as keyof typeof b.c] as string;
    return av > bv ? dir : av < bv ? -dir : 0;
  });

  function toggleSort(key: SortKey) {
    setSort(s => s.key === key
      ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: key === 'riskScore' || key === 'dateOpened' ? 'desc' : 'asc' }
    );
  }

  const hasActiveFilters = filterType || filterStatus || filterPriority || filterWaiting || filterOwner;

  function clearFilters() {
    setFilterType(''); setFilterStatus(''); setFilterPriority(''); setFilterWaiting(''); setFilterOwner('');
  }

  function Th({ col, label }: { col: SortKey | null; label: string }) {
    return (
      <th
        className={`px-3 py-2 text-left text-[11px] font-semibold text-slate-500 whitespace-nowrap bg-slate-50 select-none ${col ? 'cursor-pointer hover:text-slate-700' : ''}`}
        onClick={() => col && toggleSort(col)}
      >
        <span className="flex items-center gap-1">
          {label}
          {col && (sort.key === col
            ? (sort.dir === 'asc' ? <ChevronUp size={11} className="text-blue-500" /> : <ChevronDown size={11} className="text-blue-500" />)
            : <ChevronUp size={11} className="text-slate-300" />
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-3 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Customer Cases</h1>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} of {cases.length} cases</p>
        </div>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
        {/* Row 1: search + toggle + quick filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-72">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, ID, case type…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${showFilters || hasActiveFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <SlidersHorizontal size={12} />
            Filters
            {hasActiveFilters && <span className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">!</span>}
          </button>

          <div className="flex items-center gap-1.5">
            {QUICK_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setQuickFilter(quickFilter === f.key ? '' : f.key)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${quickFilter === f.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
              <X size={11} /> Clear
            </button>
          )}
        </div>

        {/* Row 2: dropdown filters */}
        {showFilters && (
          <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100">
            {[
              { value: filterType,    set: setFilterType,    opts: CASE_TYPES, placeholder: 'Case Type' },
              { value: filterStatus,  set: setFilterStatus,  opts: STATUSES,   placeholder: 'Status' },
              { value: filterPriority,set: setFilterPriority,opts: PRIORITIES, placeholder: 'Priority' },
              { value: filterWaiting, set: setFilterWaiting, opts: WAITING_ON, placeholder: 'Waiting On' },
              { value: filterOwner,   set: setFilterOwner,   opts: OWNERS,     placeholder: 'Owner' },
            ].map(({ value, set, opts, placeholder }) => (
              <select
                key={placeholder}
                value={value}
                onChange={e => set(e.target.value)}
                className={`border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${value ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
              >
                <option value="">{placeholder}</option>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-300px)] scrollbar-thin">
          <table className="w-full text-xs min-w-[1100px] table-sticky">
            <thead>
              <tr className="border-b border-slate-200">
                <Th col="customerName" label="Customer" />
                <Th col="caseType" label="Case Type" />
                <Th col="priority" label="Priority" />
                <Th col="riskScore" label="Calculated Risk" />
                <Th col="status" label="Status" />
                <Th col={null} label="Owner" />
                <Th col="dateOpened" label="Days Open" />
                <Th col={null} label="Last Update" />
                <Th col="nextFollowUp" label="Next Follow-Up" />
                <Th col={null} label="Waiting On" />
                <Th col={null} label="" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(({ c, risk }) => {
                const overdue = isOverdue(c);
                const dueToday = isDueToday(c);
                const noUpdate = hasNoRecentUpdate(c);
                const since = daysSinceLastUpdate(c);
                const open = daysOpen(c);
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50 transition-colors ${risk.level === 'Critical' ? 'bg-red-50/30' : overdue ? 'bg-orange-50/20' : ''}`}
                  >
                    <td className="px-3 py-2.5">
                      <Link to={`/cases/${c.id}`} className="font-medium text-blue-600 hover:text-blue-700 leading-none block">{c.customerName}</Link>
                      <span className="text-[10px] text-slate-400">{c.id}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.caseType}</td>
                    <td className="px-3 py-2.5"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-3 py-2.5"><RiskBadge level={risk.level} score={risk.score} /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{c.owner}</td>
                    <td className="px-3 py-2.5">
                      <span className={`font-medium ${open >= 30 ? 'text-red-600' : open >= 14 ? 'text-orange-600' : 'text-slate-600'}`}>{open}d</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={noUpdate ? 'text-orange-600 font-medium' : 'text-slate-400'}>
                        {since === 0 ? 'Today' : `${since}d ago`}{noUpdate ? ' ⚠' : ''}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {c.nextFollowUp
                        ? <span className={overdue ? 'text-red-600 font-semibold' : dueToday ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                            {overdue ? '⚠ ' : dueToday ? '📅 ' : ''}{c.nextFollowUp}
                          </span>
                        : <span className="text-slate-300">—</span>
                      }
                    </td>
                    <td className="px-3 py-2.5"><WaitingBadge waitingOn={c.waitingOn} /></td>
                    <td className="px-3 py-2.5">
                      <a href={c.hubspotLink} className="text-slate-300 hover:text-blue-500 transition-colors">
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No cases match your current filters.</div>
        )}
      </div>
    </div>
  );
}
