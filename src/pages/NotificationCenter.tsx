import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertCircle, Truck, CheckCircle, AlertTriangle, Clock, Users, Zap, BellOff, Hash, ChevronDown, ChevronUp, Copy, CheckCheck } from 'lucide-react';
import { notifications } from '../data/sampleData';
import { buildSlackPreview } from '../utils/caseLogic';

const TYPE_CONFIG = {
  overdue:                   { label: 'Overdue',              icon: AlertCircle,   color: 'text-red-600',    bg: 'bg-red-50 border-red-100',      dot: 'bg-red-500' },
  truck_roll_scheduled:      { label: 'TR Scheduled',         icon: Truck,         color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100',    dot: 'bg-blue-500' },
  truck_roll_completed:      { label: 'TR Completed',         icon: CheckCircle,   color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-100',dot: 'bg-emerald-500' },
  truck_roll_missing_outcome:{ label: 'Missing Outcome',      icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100',dot: 'bg-orange-500' },
  customer_not_updated:      { label: 'Cust. Not Updated',    icon: Users,         color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100',dot: 'bg-orange-500' },
  revisit_required:          { label: 'Revisit Required',     icon: Truck,         color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100',dot: 'bg-orange-500' },
  internal_overdue:          { label: 'Internal Overdue',     icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100',  dot: 'bg-amber-500' },
  escalation_detected:       { label: 'Escalation',           icon: Zap,           color: 'text-red-700',    bg: 'bg-red-50 border-red-200',      dot: 'bg-red-600' },
} as const;

const CHANNEL_MAP: Record<string, string> = {
  overdue: '#cs-followups', truck_roll_scheduled: '#cs-truck-rolls',
  truck_roll_completed: '#cs-truck-rolls', truck_roll_missing_outcome: '#cs-truck-rolls',
  customer_not_updated: '#cs-truck-rolls', revisit_required: '#cs-truck-rolls',
  internal_overdue: '#cs-internal', escalation_detected: '#cs-escalations',
};

function SlackPreviewCard({ n }: { n: typeof notifications[0] }) {
  const [copied, setCopied] = useState(false);
  const preview = buildSlackPreview(n.type, n.message, n.caseId, n.customerName, n.timestamp);

  let parsed: any = null;
  try { parsed = JSON.parse(n.slackPayload); } catch {}

  const attachmentColorMap: Record<string, string> = {
    '#ef4444': 'border-l-red-500', '#f97316': 'border-l-orange-500',
    '#3b82f6': 'border-l-blue-500', '#eab308': 'border-l-yellow-500',
    '#22c55e': 'border-l-green-500', '#dc2626': 'border-l-red-600',
  };

  return (
    <div className="mt-2.5 bg-slate-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border-b border-slate-700">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-purple-500 flex items-center justify-center">
            <span className="text-[7px] text-white font-bold">S</span>
          </div>
          <span className="text-xs text-slate-300 font-medium">Slack</span>
          <Hash size={10} className="text-slate-500" />
          <span className="text-xs text-slate-400">{preview.channel.replace('#', '')}</span>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(n.slackPayload); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-slate-700"
        >
          {copied ? <><CheckCheck size={11} className="text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy size={11} />JSON</>}
        </button>
      </div>
      <div className="px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-white">CS</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-bold text-white">SolarCS Bot</span>
              <span className="text-[10px] text-slate-500">
                {new Date(n.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            {parsed ? (
              <div>
                <p className="text-xs text-slate-200 mb-1.5">{parsed.text}</p>
                {parsed.attachments?.map((att: any, i: number) => {
                  const borderClass = attachmentColorMap[att.color] || 'border-l-slate-400';
                  return (
                    <div key={i} className={`border-l-4 ${borderClass} bg-slate-700/50 rounded-r pl-3 pr-3 py-2 space-y-1.5`}>
                      {att.fields?.map((f: any) => (
                        <div key={f.title} className={f.short ? 'inline-block mr-5' : 'block'}>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{f.title}</div>
                          <div className="text-xs text-slate-200">{f.value}</div>
                        </div>
                      ))}
                      {att.footer && <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-600/50">{att.footer}</div>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-200">{n.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter() {
  const [items, setItems] = useState(notifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [expandedSlack, setExpandedSlack] = useState<string | null>(null);

  const unread = items.filter(n => !n.read);
  const displayed = filter === 'unread' ? unread : items;

  function markRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }
  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Notification Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">{unread.length} unread · Slack preview per alert</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-md p-0.5">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${filter === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f === 'all' ? `All (${items.length})` : `Unread (${unread.length})`}
              </button>
            ))}
          </div>
          {unread.length > 0 && (
            <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {displayed.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
            <BellOff size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No notifications.</p>
          </div>
        ) : (
          displayed.map(n => {
            const config = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG];
            const Icon = config.icon;
            const slackOpen = expandedSlack === n.id;
            return (
              <div key={n.id} className={`border rounded-lg overflow-hidden transition-opacity ${n.read ? 'opacity-60' : ''} ${config.bg}`}>
                <div className="flex items-start gap-3 p-3">
                  <div className="flex-shrink-0 mt-0.5 relative">
                    <Icon size={16} className={config.color} />
                    {!n.read && (
                      <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white ${config.dot}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-[11px] font-semibold uppercase tracking-wide ${config.color}`}>{config.label}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(n.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <Link to={`/cases/${n.caseId}`} className="text-xs text-blue-600 hover:underline">{n.caseId}</Link>
                      <button
                        onClick={() => setExpandedSlack(slackOpen ? null : n.id)}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                      >
                        <div className="w-3 h-3 rounded bg-purple-500 flex items-center justify-center">
                          <span className="text-[7px] text-white font-bold">S</span>
                        </div>
                        {slackOpen ? 'Hide' : 'Slack preview'}
                        {slackOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} className="text-xs text-slate-400 hover:text-slate-600">
                          Mark read
                        </button>
                      )}
                    </div>
                    {slackOpen && <SlackPreviewCard n={n} />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Bell size={12} /> Channels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {(Object.entries(TYPE_CONFIG) as [string, typeof TYPE_CONFIG[keyof typeof TYPE_CONFIG]][]).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-2 text-xs text-slate-600">
                <Icon size={12} className={config.color} />
                <span className="flex-1">{config.label}</span>
                <span className="text-slate-400 font-mono text-[10px]">{CHANNEL_MAP[key]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
