import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarCheck, Truck,
  Clock, AlertTriangle, Bell, FileText, ChevronLeft, ChevronRight, Sun,
  ShieldCheck, BarChart2, MonitorDot, FlaskConical,
} from 'lucide-react';
import { notifications } from '../data/sampleData';

const NAV = [
  { path: '/',                label: 'Dashboard',        icon: LayoutDashboard },
  { path: '/cases',           label: 'Customer Cases',   icon: Users },
  { path: '/follow-up',       label: 'Follow-Up Center', icon: CalendarCheck },
  { path: '/truck-roll',      label: 'Truck Roll Center', icon: Truck },
  { path: '/internal-waiting',label: 'Internal Waiting', icon: Clock },
  { path: '/escalation',      label: 'Escalations',      icon: AlertTriangle },
  { path: '/notifications',   label: 'Notifications',    icon: Bell },
  { path: '/templates',       label: 'Templates',        icon: FileText },
  { path: '/kpi',             label: 'Admin KPI Center', icon: BarChart2 },
  { path: '/executive',       label: 'Executive Dashboard', icon: MonitorDot },
  { path: '/testing',         label: 'Testing Center',   icon: FlaskConical },
];

const ADMIN_NAV = [
  { path: '/kpi',       label: 'Admin KPI Center',      icon: BarChart2 },
  { path: '/executive', label: 'Executive Dashboard',   icon: MonitorDot },
  { path: '/testing',   label: 'Testing Center',        icon: FlaskConical },
];

// Export so Dashboard can read it — simple module-level ref trick
// We use a Context-free approach: just pass isAdmin as a prop via children render
// But since children is static JSX, we use a global signal instead.
// The cleanest approach: keep state here, export a context from here.

import { createContext, useContext } from 'react';
export const AdminCtx = createContext(false);
export function useIsAdmin() { return useContext(AdminCtx); }

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const unread = notifications.filter(n => !n.read).length;

  function handleAdminToggle() {
    // NOTE: client-side demo toggle only — NOT an authentication or authorization
    // boundary. Real role enforcement must happen server-side before production.
    setIsAdmin(prev => !prev);
  }

  const currentPath = location.pathname;
  const allNav = [...NAV, ...(isAdmin ? ADMIN_NAV : [])];
  const currentPage = allNav.find(n =>
    currentPath === n.path || (n.path !== '/' && currentPath.startsWith(n.path))
  );

  return (
    <AdminCtx.Provider value={isAdmin}>
      <div className="flex h-screen bg-slate-100 overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className={`${collapsed ? 'w-14' : 'w-56'} bg-slate-900 flex flex-col flex-shrink-0 transition-all duration-200`}>

          {/* Brand */}
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

          {/* Nav links */}
          <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
            {NAV.map(({ path, label, icon: Icon }) => {
              const active = currentPath === path || (path !== '/' && currentPath.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  title={collapsed ? label : undefined}
                  className={`relative flex items-center gap-2.5 mx-1.5 px-2.5 py-2 rounded-md mb-0.5 text-sm transition-colors group ${
                    active ? 'bg-amber-400 text-slate-900 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
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

            {/* ── Admin nav items ── */}
            {isAdmin && (
              <>
                <div className="mx-2 my-2">
                  {!collapsed ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest whitespace-nowrap">Admin</span>
                      <div className="flex-1 border-t border-slate-700" />
                    </div>
                  ) : (
                    <div className="border-t border-slate-700" />
                  )}
                </div>
                {ADMIN_NAV.map(({ path, label, icon: Icon }) => {
                  const active = currentPath === path || currentPath.startsWith(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      title={collapsed ? label : undefined}
                      className={`relative flex items-center gap-2.5 mx-1.5 px-2.5 py-2 rounded-md mb-0.5 text-sm transition-colors group ${
                        active ? 'bg-red-600 text-white font-semibold' : 'text-red-400 hover:bg-red-900/40 hover:text-red-300'
                      }`}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                      {!collapsed && path === '/kpi' && (
                        <ShieldCheck size={11} className="ml-auto opacity-50 flex-shrink-0" />
                      )}
                      {collapsed && (
                        <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                          {label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* ── Admin Toggle ── always visible above collapse ── */}
          <div className="flex-shrink-0 px-2 py-2 border-t border-slate-700">
            <button
              id="admin-toggle-btn"
              data-admin={isAdmin ? 'on' : 'off'}
              onClick={handleAdminToggle}
              title={isAdmin ? 'Admin: ON — click to disable' : 'Admin: OFF — click to enable'}
              className={`w-full flex items-center rounded-md font-semibold transition-all ${
                collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-2.5 px-3 py-2.5'
              } ${
                isAdmin
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-slate-700 text-slate-100 hover:bg-slate-600 border border-slate-500'
              }`}
            >
              <ShieldCheck size={16} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm">{isAdmin ? 'Admin: ON' : 'Admin: OFF'}</span>
              )}
              {!collapsed && (
                <span className={`ml-auto text-[10px] px-1 py-0.5 rounded font-bold ${isAdmin ? 'bg-white/20 text-white' : 'bg-slate-600 text-slate-300'}`}>
                  {isAdmin ? 'ON' : 'OFF'}
                </span>
              )}
            </button>
          </div>

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

        {/* ── Main area ─────────────────────────────────────────────────── */}
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
              {isAdmin && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 ring-1 ring-red-200 px-2 py-0.5 rounded-md">
                  <ShieldCheck size={11} /> Admin Mode
                </span>
              )}
              <span className="text-xs text-slate-400">Mon · Jun 15, 2026</span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-900">SM</span>
                </div>
                <span className="text-sm font-medium text-slate-700">Sarah Mitchell</span>
              </div>
            </div>
          </header>

          {/* Admin Mode active banner */}
          {isAdmin && (
            <div className="flex-shrink-0 bg-red-600 text-white text-xs font-semibold px-5 py-1.5 flex items-center gap-2">
              <ShieldCheck size={13} />
              Admin Mode Active — KPI Center, Executive Dashboard, and Testing Center are now visible in the sidebar.
            </div>
          )}

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </AdminCtx.Provider>
  );
}
