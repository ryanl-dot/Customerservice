import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertCircle, Truck, CheckCircle, AlertTriangle, Clock, Users, Zap, BellOff } from 'lucide-react';
import { notifications } from '../data/sampleData';

const TYPE_CONFIG = {
  overdue: { label: 'Overdue', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-100', dot: 'bg-red-500' },
  truck_roll_scheduled: { label: 'Truck Roll Scheduled', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', dot: 'bg-blue-500' },
  truck_roll_completed: { label: 'Truck Roll Completed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-100', dot: 'bg-green-500' },
  truck_roll_missing_outcome: { label: 'Missing Outcome', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', dot: 'bg-orange-500' },
  customer_not_updated: { label: 'Customer Not Updated', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', dot: 'bg-orange-500' },
  revisit_required: { label: 'Revisit Required', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', dot: 'bg-orange-500' },
  internal_overdue: { label: 'Internal Overdue', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100', dot: 'bg-yellow-500' },
  escalation_detected: { label: 'Escalation Detected', icon: Zap, color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-600' },
};

export default function NotificationCenter() {
  const [items, setItems] = useState(notifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unread = items.filter(n => !n.read);
  const displayed = filter === 'unread' ? unread : items;

  function markRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }
  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  }

  function formatTime(ts: string) {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notification Center</h1>
          <p className="text-slate-500 text-sm">{unread.length} unread notifications</p>
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

      {/* Simulated Slack-style feed */}
      <div className="space-y-2">
        {displayed.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <BellOff size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">No notifications to show.</p>
          </div>
        ) : (
          displayed.map(n => {
            const config = TYPE_CONFIG[n.type];
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={`rounded-xl border p-4 flex items-start gap-4 transition-opacity ${n.read ? 'opacity-60' : ''} ${config.bg}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="relative">
                    <Icon size={20} className={config.color} />
                    {!n.read && (
                      <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${config.dot}`} />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>{config.label}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatTime(n.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-700">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Link to={`/cases/${n.caseId}`} className="text-xs text-blue-600 hover:underline">View Case {n.caseId}</Link>
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="text-xs text-slate-400 hover:text-slate-600">
                        Mark as read
                      </button>
                    )}
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
          <Bell size={14} /> Alert Types
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(TYPE_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-2 text-xs text-slate-600">
                <Icon size={14} className={config.color} />
                <span>{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
