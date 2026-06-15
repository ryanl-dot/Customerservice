import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarCheck, Truck,
  Clock, AlertTriangle, Bell, FileText, Menu, X, Sun, ChevronRight
} from 'lucide-react';
import { notifications } from '../data/sampleData';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/cases', label: 'Customer Cases', icon: Users },
  { path: '/follow-up', label: 'Follow-Up Center', icon: CalendarCheck },
  { path: '/truck-roll', label: 'Truck Roll Center', icon: Truck },
  { path: '/internal-waiting', label: 'Internal Waiting Board', icon: Clock },
  { path: '/escalation', label: 'Escalation Center', icon: AlertTriangle },
  { path: '/notifications', label: 'Notification Center', icon: Bell },
  { path: '/templates', label: 'Template Library', icon: FileText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-900 flex flex-col transition-all duration-300 flex-shrink-0`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-slate-700 ${!sidebarOpen && 'justify-center'}`}>
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sun size={18} className="text-slate-900" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-white font-bold text-sm leading-tight">SolarCS</div>
              <div className="text-slate-400 text-xs">Command Center</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-1 transition-colors group relative
                  ${active ? 'bg-amber-400 text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
                {!sidebarOpen && (
                  <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                    {label}
                  </div>
                )}
                {path === '/notifications' && unreadCount > 0 && (
                  <span className={`ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ${!sidebarOpen && 'absolute top-1 right-1 w-4 h-4 text-[10px]'}`}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <><X size={16} /><span className="text-xs">Collapse</span></> : <Menu size={16} />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {navItems.find(n => location.pathname === n.path || (n.path !== '/' && location.pathname.startsWith(n.path)))?.label && (
              <>
                <span>SolarCS</span>
                <ChevronRight size={14} />
                <span className="text-slate-800 font-medium">
                  {navItems.find(n => location.pathname === n.path || (n.path !== '/' && location.pathname.startsWith(n.path)))?.label}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Mon, June 15, 2026</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-slate-900">SM</span>
              </div>
              <span className="text-sm font-medium text-slate-700">Sarah Mitchell</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
