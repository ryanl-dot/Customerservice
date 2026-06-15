import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertCircle, Truck, CheckCircle, AlertTriangle, Clock, Users, Zap, BellOff, Hash, ChevronDown, ChevronUp, Copy, CheckCheck } from 'lucide-react';
import { notifications } from '../data/sampleData';
import { buildSlackPreview } from '../utils/caseLogic';

const TYPE_CONFIG = {
  overdue:                   { label: 'Overdue',                  icon: AlertCircle,   color: 'text-red-600',    bg: 'bg-red-50 border-red-100',      dot: 'bg-red-500' },
  truck_roll_scheduled:      { label: 'Truck Roll Scheduled',     icon: Truck,         color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100',    dot: 'bg-blue-500' },
  truck_roll_completed:      { label: 'Truck Roll Completed',     icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50 border-green-100',  dot: 'bg-green-500' },
  truck_roll_missing_outcome:{ label: 'Missing Outcome',          icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100',dot: 'bg-orange-500' },
  customer_not_updated:      { label: 'Customer Not Updated',     icon: Users,         color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100',dot: 'bg-orange-500' },
  revisit_required:          { label: 'Revisit Required',         icon: Truck,         color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100',dot: 'bg-orange-500' },
  internal_overdue:          { label: 'Internal Overdue',         icon: Clock,         color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100',dot: 'bg-yellow-500' },
  escalation_detected:       { label: 'Escalation Detected',      icon: Zap,           color: 'text-red-700',    bg: 'bg-red-50 border-red-200',      dot: 'bg-red-600' },
} as const;

function SlackPreviewCard({ n }: { n: typeof notifications[0] }) {
  const [copied, setCopied] = useState(false);
  const preview = buildSlackPreview(n.type, n.message, n.caseId, n.customerName, n.timestamp);

  let parsed: any = null;
  try { parsed = JSON.parse(n.slackPayload); } catch {}

  function copyPayload() {
    navigator.clipboard.writeText(n.slackPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const attachmentColorMap: Record<string, string> = {
    '#ef4444': 'border-l-red-500',
    '#f97316': 'border-l-orange-500',
    '#3b82f6': 'border-l-blue-500',
    '#eab308': 'border-l-yellow-500',
    '#22c55e': 'border-l-green-500',
    '#dc2626': 'border-l-red-600',
  };

  return (
    <div className="mt-3 bg-slate-800 rounded-xl overflow-hidden">
      {/* Slack header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500 flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">S</span>
          </div>
          <span className="text-xs text-slate-300 font-medium">Slack Preview</span>
          <span className="text-xs text-slate-500">·</span>
          <Hash size={11} className="text-slate-400" />
          <span className="text-xs text-slate-400">{preview.channel.replace('#', '')}</span>
        </div>
        <button onClick={copyPayload} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-700">
          {copied ? <><CheckCheck size={12} className="text-green-400" /> <span className="text-green-400">Copied</span></> : <><Copy size={12} /> Copy JSON</>}
        </button>
      </div>

      {/* Message body */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-white">CS</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-bold text-white">SolarCS Bot</span>
              <span className="text-xs text-slate-500">
                {new Date(n.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            {parsed ? (
              <div>
                <p className="text-sm text-slate-200 mb-2">{parsed.text}</p>
                {parsed.attachments?.map((att: any, i: number) => {
                  const borderClass = attachmentColorMap[att.color] || 'border-l-slate-400';
                  return (
                    <div key={i} className={`border-l-4 ${borderClass} bg-slate-700/50 rounded-r-lg pl-3 pr-3 py-2.5 space-y-2`}>
                      {att.fields?.map((f: any) => (
                        <div key={f.title} className={f.short ? 'inline-block mr-6' : 'block'}>
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{f.title}</div>
                          <div className="text-sm text-slate-200">{f.value}</div>
                        </div>
                      ))}
                      {att.footer && (
                        <div className="text-xs text-slate-500 pt-1 border-t border-slate-600/50">{att.footer}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-200">{n.message}</p>
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

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notification Center</h1>
          <p className="text-slate-500 text-sm">{unread.length} unread · Slack previews included for each alert</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f === 'all' ? `All (${items.length})` : `Unread (${unread.length})`}
              </button>
            ))}
          </div>
          {unread.length > 0 && (
            <button onClick={markAllRead} className="text-sm text-blue-600 hover:underline">
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <BellOff size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">No notifications to show.</p>
          </div>
        ) : (
          displayed.map(n => {
            const config = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG];
            const Icon = config.icon;
            const slackOpen = expandedSlack === n.id;
            return (
              <div
                key={n.id}
                className={`rounded-xl border overflow-hidden transition-opacity ${n.read ? 'opacity-60' : ''} ${config.bg}`}
              >
                {/* Main notification row */}
                <div className="flex items-start gap-4 p-4">
                  <div className="flex-shrink-0 mt-0.5 relative">
                    <Icon size={20} className={config.color} />
                    {!n.read && (
                      <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${config.dot}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>{config.label}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{formatTime(n.timestamp)}</span>
                    </div>
                    <p className="text-sm text-slate-700">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Link to={`/cases/${n.caseId}`} className="text-xs text-blue-600 hover:underline">
                        View {n.caseId}
                      </Link>
                      <button
                        onClick={() => setExpandedSlack(slackOpen ? null : n.id)}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                      >
                        <div className="w-3 h-3 rounded bg-purple-500 flex items-center justify-center">
                          <span className="text-[7px] text-white font-bold">S</span>
                        </div>
                        {slackOpen ? 'Hide' : 'Preview'} Slack message
                        {slackOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
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
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Bell size={14} /> Alert Types & Slack Channels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(Object.entries(TYPE_CONFIG) as [string, typeof TYPE_CONFIG[keyof typeof TYPE_CONFIG]][]).map(([key, config]) => {
            const Icon = config.icon;
            const channelMap: Record<string, string> = {
              overdue: '#cs-followups', truck_roll_scheduled: '#cs-truck-rolls',
              truck_roll_completed: '#cs-truck-rolls', truck_roll_missing_outcome: '#cs-truck-rolls',
              customer_not_updated: '#cs-truck-rolls', revisit_required: '#cs-truck-rolls',
              internal_overdue: '#cs-internal', escalation_detected: '#cs-escalations',
            };
            return (
              <div key={key} className="flex items-center gap-3 text-xs text-slate-600">
                <Icon size={14} className={config.color} />
                <span className="flex-1">{config.label}</span>
                <span className="text-slate-400 font-mono">{channelMap[key]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
