import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ExternalLink, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { cases, truckRolls, OWNERS } from '../data/sampleData';
import type { CaseType, CaseStatus, Priority, WaitingOn } from '../data/sampleData';
import { PriorityBadge, StatusBadge, WaitingBadge, RiskBadge } from '../components/Badge';
import {
  computeRisk, daysOpen, daysSinceLastUpdate, isOverdue, isDueToday, hasNoRecentUpdate,
} from '../utils/caseLogic';

const CASE_TYPES: CaseType[] = ['Billing','Production','Gateway Not Reporting','Roof Leak','Collections','Complaint','Utility Issue','PTO Issue','ACH Issue','Cancellation'];
const STATUSES: CaseStatus[] = ['New','In Progress','Waiting on Customer','Waiting on Internal Team','Truck Roll Scheduled','Pending Approval','Revisit Required','Resolved','Closed'];
const PRIORITIES: Priority[] = ['Low','Medium','High','Urgent'];
const WAITING_ON: WaitingOn[] = ['Installer','Warehouse','Engineering','Billing','Utility','Customer','Management','Legal','None'];

type SortKey = 'customerName' | 'caseType' | 'priority' | 'status' | 'dateOpened' | 'nextFollowUp' | 'riskScore';

export default function CustomerCases() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterWaiting, setFilterWaiting] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterDueToday, setFilterDueToday] = useState(false);
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [filterHighPriority, setFilterHighPriority] = useState(false);
  const [filterNoUpdate, setFilterNoUpdate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'riskScore', dir: 'desc' });

  // Pre-compute risk for all cases
  const withRisk = cases.map(c => {
    const tr = truckRolls.find(t => t.id === c.truckRollId);
    return { c, risk: computeRisk(c, tr) };
  });

  const filtered = withRisk.filter(({ c }) => {
    if (search && !c.customerName.toLowerCase().includes(search.toLowerCase()) && !c.id.toLowerCase().includes(search.toLowerCase()) && !c.caseType.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && c.caseType !== filterType) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    if (filterWaiting && c.waitingOn !== filterWaiting) return false;
    if (filterOwner && c.owner !== filterOwner) return false;
    if (filterDueToday && !isDueToday(c)) return false;
    if (filterOverdue && !isOverdue(c)) return false;
    if (filterHighPriority && c.priority !== 'High' && c.priority !== 'Urgent') return false;
    if (filterNoUpdate && !hasNoRecentUpdate(c)) return false;
    return true;
  }).sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    if (sort.key === 'riskScore') return (a.risk.score - b.risk.score) * dir;
    return (a.c[sort.key as keyof typeof a.c] as string) > (b.c[sort.key as keyof typeof b.c] as string) ? dir : -dir;
  });

  function toggleSort(key: SortKey) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'riskScore' ? 'desc' : 'asc' });
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col) return <ChevronUp size={12} className="text-slate-300" />;
    return sort.dir === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />;
  }

  const overdueCount = filtered.filter(({ c }) => isOverdue(c)).length;
  const noUpdateCount = filtered.filter(({ c }) => hasNoRecentUpdate(c)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customer Cases</h1>
          <p className="text-slate-500 text-sm">{filtered.length} cases shown · sorted by Risk Score</p>
        </div>
        <div className="flex items-center gap-3">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
              <AlertCircle size={14} />
              {overdueCount} overdue
            </div>
          )}
          {noUpdateCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg">
              <AlertCircle size={14} />
              {noUpdateCount} no update 3d+
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or case type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
          {[
            { label: 'Due Today', active: filterDueToday, toggle: () => setFilterDueToday(!filterDueToday) },
            { label: 'Overdue', active: filterOverdue, toggle: () => setFilterOverdue(!filterOverdue) },
            { label: 'High Priority', active: filterHighPriority, toggle: () => setFilterHighPriority(!filterHighPriority) },
            { label: 'No Update 3d+', active: filterNoUpdate, toggle: () => setFilterNoUpdate(!filterNoUpdate) },
          ].map(f => (
            <button
              key={f.label}
              onClick={f.toggle}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${f.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100">
            {[
              { value: filterType, set: setFilterType, opts: CASE_TYPES, placeholder: 'All Case Types' },
              { value: filterStatus, set: setFilterStatus, opts: STATUSES, placeholder: 'All Statuses' },
              { value: filterPriority, set: setFilterPriority, opts: PRIORITIES, placeholder: 'All Priorities' },
              { value: filterWaiting, set: setFilterWaiting, opts: WAITING_ON, placeholder: 'All Waiting On' },
              { value: filterOwner, set: setFilterOwner, opts: OWNERS, placeholder: 'All Owners' },
            ].map(({ value, set, opts, placeholder }) => (
              <select key={placeholder} value={value} onChange={e => set(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">{placeholder}</option>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1300px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  { label: 'Customer', key: 'customerName' as SortKey },
                  { label: 'Case Type', key: 'caseType' as SortKey },
                  { label: 'Priority', key: 'priority' as SortKey },
                  { label: 'Risk Score', key: 'riskScore' as SortKey },
                  { label: 'Status', key: 'status' as SortKey },
                  { label: 'Owner', key: null },
                  { label: 'Days Open', key: 'dateOpened' as SortKey },
                  { label: 'Last Update', key: null },
                  { label: 'Next Follow-Up', key: 'nextFollowUp' as SortKey },
                  { label: 'Waiting On', key: null },
                  { label: 'HubSpot', key: null },
                ].map(col => (
                  <th
                    key={col.label}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap cursor-pointer select-none"
                    onClick={() => col.key && toggleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.key && <SortIcon col={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(({ c, risk }) => {
                const overdue = isOverdue(c);
                const noUpdate = hasNoRecentUpdate(c);
                const sinceUpdate = daysSinceLastUpdate(c);
                const open = daysOpen(c);
                const rowBg = risk.level === 'Critical' ? 'bg-red-50/40' : overdue ? 'bg-orange-50/30' : '';
                return (
                  <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${rowBg}`}>
                    <td className="px-4 py-3">
                      <Link to={`/cases/${c.id}`} className="font-medium text-blue-600 hover:underline block">{c.customerName}</Link>
                      <span className="text-xs text-slate-400">{c.id}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.caseType}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3"><RiskBadge level={risk.level} score={risk.score} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.owner}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${open >= 30 ? 'text-red-600' : open >= 14 ? 'text-orange-600' : 'text-slate-600'}`}>
                        {open}d
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${noUpdate ? 'text-orange-600 font-semibold' : 'text-slate-500'}`}>
                        {sinceUpdate === 0 ? 'Today' : `${sinceUpdate}d ago`}
                        {noUpdate && ' ⚠'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {c.nextFollowUp ? (
                        <span className={overdue ? 'text-red-600 font-semibold' : isDueToday(c) ? 'text-amber-600 font-semibold' : 'text-slate-600'}>
                          {overdue && '⚠ '}{isDueToday(c) && '📅 '}{c.nextFollowUp}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3"><WaitingBadge waitingOn={c.waitingOn} /></td>
                    <td className="px-4 py-3">
                      <a href={c.hubspotLink} className="text-slate-400 hover:text-blue-500 flex items-center gap-1 text-xs">
                        <ExternalLink size={12} /> HubSpot
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">No cases match your filters.</div>
        )}
      </div>
    </div>
  );
}
