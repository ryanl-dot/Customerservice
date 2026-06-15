import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { cases, OWNERS } from '../data/sampleData';
import type { CaseType, CaseStatus, Priority, WaitingOn } from '../data/sampleData';
import { PriorityBadge, StatusBadge, WaitingBadge } from '../components/Badge';

const TODAY = '2026-06-15';

const CASE_TYPES: CaseType[] = ['Billing','Production','Gateway Not Reporting','Roof Leak','Collections','Complaint','Utility Issue','PTO Issue','ACH Issue','Cancellation'];
const STATUSES: CaseStatus[] = ['New','In Progress','Waiting on Customer','Waiting on Internal Team','Truck Roll Scheduled','Pending Approval','Revisit Required','Resolved','Closed'];
const PRIORITIES: Priority[] = ['Low','Medium','High','Urgent'];
const WAITING_ON: WaitingOn[] = ['Installer','Warehouse','Engineering','Billing','Utility','Customer','Management','Legal','None'];

type SortKey = 'customerName' | 'caseType' | 'priority' | 'status' | 'dateOpened' | 'nextFollowUp';

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
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'dateOpened', dir: 'desc' });

  const filtered = cases.filter(c => {
    if (search && !c.customerName.toLowerCase().includes(search.toLowerCase()) && !c.id.toLowerCase().includes(search.toLowerCase()) && !c.caseType.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && c.caseType !== filterType) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    if (filterWaiting && c.waitingOn !== filterWaiting) return false;
    if (filterOwner && c.owner !== filterOwner) return false;
    if (filterDueToday && c.nextFollowUp !== TODAY) return false;
    if (filterOverdue && !(c.nextFollowUp && c.nextFollowUp < TODAY)) return false;
    if (filterHighPriority && c.priority !== 'High' && c.priority !== 'Urgent') return false;
    return true;
  }).sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return a[sort.key] > b[sort.key] ? dir : -dir;
  });

  function toggleSort(key: SortKey) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col) return <ChevronUp size={12} className="text-slate-300" />;
    return sort.dir === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customer Cases</h1>
          <p className="text-slate-500 text-sm">{filtered.length} cases shown</p>
        </div>
        <Link to="/cases/new" className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
          + New Case
        </Link>
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
          {/* Quick filter chips */}
          {[
            { label: 'Due Today', active: filterDueToday, toggle: () => setFilterDueToday(!filterDueToday) },
            { label: 'Overdue', active: filterOverdue, toggle: () => setFilterOverdue(!filterOverdue) },
            { label: 'High Priority', active: filterHighPriority, toggle: () => setFilterHighPriority(!filterHighPriority) },
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
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Case Types</option>
              {CASE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={filterWaiting} onChange={e => setFilterWaiting(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Waiting On</option>
              {WAITING_ON.map(w => <option key={w}>{w}</option>)}
            </select>
            <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Owners</option>
              {OWNERS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  { label: 'Customer', key: 'customerName' as SortKey },
                  { label: 'Case Type', key: 'caseType' as SortKey },
                  { label: 'Priority', key: 'priority' as SortKey },
                  { label: 'Status', key: 'status' as SortKey },
                  { label: 'Owner', key: null },
                  { label: 'Opened', key: 'dateOpened' as SortKey },
                  { label: 'Last Update', key: null },
                  { label: 'Next Follow-Up', key: 'nextFollowUp' as SortKey },
                  { label: 'Waiting On', key: null },
                  { label: 'HubSpot', key: null },
                ].map(col => (
                  <th
                    key={col.label}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap"
                    onClick={() => col.key && toggleSort(col.key)}
                    style={{ cursor: col.key ? 'pointer' : 'default' }}
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
              {filtered.map(c => {
                const overdue = c.nextFollowUp && c.nextFollowUp < TODAY;
                return (
                  <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${overdue ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <Link to={`/cases/${c.id}`} className="font-medium text-blue-600 hover:underline block">{c.customerName}</Link>
                      <span className="text-xs text-slate-400">{c.id}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.caseType}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.owner}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{c.dateOpened}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{c.lastUpdate}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {c.nextFollowUp ? (
                        <span className={overdue ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                          {overdue && '⚠ '}{c.nextFollowUp}
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
