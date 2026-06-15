import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarCheck, Truck,
  Clock, AlertTriangle, Bell, FileText, ChevronLeft, ChevronRight, Sun,
} from 'lucide-react';
import { notifications } from '../data/sampleData';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/cases', label: 'Customer Cases', icon: Users },
  { path: '/follow-up', label: 'Follow-Up Center', icon: CalendarCheck },
  { path: '/truck-roll', label: 'Truck Roll Center', icon: Truck },
  { path: '/internal-waiting', label: 'Internal Waiting', icon: Clock },
  { path: '/escalation', label: 'Escalations', icon: AlertTriangle },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/templates', label: 'Templates', icon: FileText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const unread = notifications.filter(n => !n.read).length;

  const currentPage = navItems.find(n =>
    location.pathname === n.path || (n.path !== '/' && location.pathname.startsWith(n.path))
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`${collapsed ? 'w-14' : 'w-56'} bg-slate-900 flex flex-col flex-shrink-0 transition-all duration-200`}>

        {/* Brand */}
        <div className={`flex items-center h-12 border-b border-slate-800 px-3 gap-2.5 flex-shrink-0`}>
          <div className="w-7 h-7 bg-amber-400 rounded-md flex items-center justify-center flex-shrink-0">
            <Sun size={14} className="text-slate-900" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm leading-none">SolarCS</div>
              <div className="text-slate-500 text-[10px] mt-0.5 leading-none">Command Center</div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path ||
              (path !== '/' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                title={collapsed ? label : undefined}
                className={`relative flex items-center gap-2.5 mx-1.5 px-2.5 py-2 rounded-md mb-0.5 text-sm transition-colors group
                  ${active
                    ? 'bg-amber-400 text-slate-900 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                    {label}
                  </span>
                )}

                {/* Unread badge */}
                {path === '/notifications' && unread > 0 && (
                  <span className={`${collapsed ? 'absolute top-0.5 right-0.5 w-3.5 h-3.5 text-[9px]' : 'ml-auto w-4 h-4 text-[10px]'} bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-9 border-t border-slate-800 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
        >
          {collapsed
            ? <ChevronRight size={14} />
            : <><ChevronLeft size={14} /><span className="text-xs ml-1.5">Collapse</span></>
          }
        </button>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-12 bg-white border-b border-slate-200 px-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-slate-400">SolarCS</span>
            {currentPage && (
              <>
                <ChevronRight size={13} className="text-slate-300" />
                <span className="font-medium text-slate-700">{currentPage.label}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Mon · Jun 15, 2026</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center">
                <span className="text-[10px] font-bold text-slate-900">SM</span>
              </div>
              <span className="text-sm font-medium text-slate-700">Sarah Mitchell</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
