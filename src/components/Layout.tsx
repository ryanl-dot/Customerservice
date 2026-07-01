import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarCheck, Truck,
  Clock, AlertTriangle, Bell, FileText, ChevronLeft, ChevronRight, Sun,
  ShieldCheck, BarChart2, MonitorDot, FlaskConical, LogOut,
} from 'lucide-react';
import { notifications } from '../data/sampleData';
import { useAuth } from '../auth/useAuth';
import type { PageKey } from '../../shared/auth/permissions';
import { canAccessPage } from '../../shared/auth/permissions';
import { ROLE_LABELS } from '../../shared/auth/roles';

interface NavItem { path: string; label: string; icon: typeof LayoutDashboard; page: PageKey; admin?: boolean }

const NAV: NavItem[] = [
  { path: '/',                label: 'Dashboard',          icon: LayoutDashboard, page: 'dashboard' },
  { path: '/cases',           label: 'Customer Cases',     icon: Users,           page: 'cases' },
  { path: '/follow-up',       label: 'Follow-Up Center',   icon: CalendarCheck,   page: 'follow-up' },
  { path: '/truck-roll',      label: 'Truck Roll Center',  icon: Truck,           page: 'truck-roll' },
  { path: '/internal-waiting',label: 'Internal Waiting',   icon: Clock,           page: 'internal-waiting' },
  { path: '/escalation',      label: 'Escalations',        icon: AlertTriangle,   page: 'escalation' },
  { path: '/notifications',   label: 'Notifications',      icon: Bell,            page: 'notifications' },
  { path: '/templates',       label: 'Templates',          icon: FileText,        page: 'templates' },
  { path: '/kpi',             label: 'Admin KPI Center',   icon: BarChart2,       page: 'kpi',       admin: true },
  { path: '/executive',       label: 'Executive Dashboard',icon: MonitorDot,      page: 'executive', admin: true },
  { path: '/testing',         label: 'Testing Center',     icon: FlaskConical,    page: 'testing',   admin: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, role, logout } = useAuth();
  const unread = notifications.filter(n => !n.read).length;
  const currentPath = location.pathname;

  // Role-driven navigation — items the role can't access are simply not rendered.
  const visibleNav = NAV.filter(n => role && canAccessPage(role, n.page));
  const currentPage = visibleNav.find(n =>
    currentPath === n.path || (n.path !== '/' && currentPath.startsWith(n.path))
  );

  const initials = (user?.name ?? '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className={`${collapsed ? 'w-14' : 'w-56'} bg-slate-900 flex flex-col flex-shrink-0 transition-all duration-200`}>
        <div className="flex items-center h-12 border-b border-slate-800 px-3 gap-2.5 flex-shrink-0">
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

        <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
          {visibleNav.map(({ path, label, icon: Icon, admin }) => {
            const active = currentPath === path || (path !== '/' && currentPath.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                title={collapsed ? label : undefined}
                className={`relative flex items-center gap-2.5 mx-1.5 px-2.5 py-2 rounded-md mb-0.5 text-sm transition-colors group ${
                  active
                    ? (admin ? 'bg-red-600 text-white font-semibold' : 'bg-amber-400 text-slate-900 font-semibold')
                    : (admin ? 'text-red-400 hover:bg-red-900/40 hover:text-red-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100')
                }`}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && admin && <ShieldCheck size={11} className="ml-auto opacity-50 flex-shrink-0" />}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                    {label}
                  </span>
                )}
                {path === '/notifications' && unread > 0 && (
                  <span className={`${collapsed ? 'absolute top-0.5 right-0.5 w-3.5 h-3.5 text-[9px]' : 'ml-auto w-4 h-4 text-[10px]'} bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-9 border-t border-slate-800 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span className="text-xs ml-1.5">Collapse</span></>}
        </button>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
            {role && (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 ring-1 ring-slate-200 px-2 py-0.5 rounded-md">
                {ROLE_LABELS[role]}
              </span>
            )}
            <span className="text-xs text-slate-400">Mon · Jun 15, 2026</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center">
                <span className="text-[10px] font-bold text-slate-900">{initials}</span>
              </div>
              <span className="text-sm font-medium text-slate-700">{user?.name ?? 'Unknown'}</span>
            </div>
            <button
              onClick={() => { void logout(); }}
              title="Sign out"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-md px-2 py-1 hover:bg-slate-50 transition-colors"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
