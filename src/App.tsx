import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout, { useIsAdmin } from './components/Layout';
import Dashboard from './pages/Dashboard';
import CustomerCases from './pages/CustomerCases';
import CaseDetail from './pages/CaseDetail';
import FollowUpCenter from './pages/FollowUpCenter';
import TruckRollCenter from './pages/TruckRollCenter';
import InternalWaitingBoard from './pages/InternalWaitingBoard';
import EscalationCenter from './pages/EscalationCenter';
import NotificationCenter from './pages/NotificationCenter';
import TemplateLibrary from './pages/TemplateLibrary';
import KPICenter from './pages/KPICenter';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import TestingCenter from './pages/TestingCenter';
import { ShieldCheck } from 'lucide-react';

// TODO: Replace with real authentication before production.
// This guard hides admin pages from non-admin users in the UI only — it is NOT a security boundary.
function AdminGuard({ children }: { children: React.ReactNode }) {
  const isAdmin = useIsAdmin();
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <ShieldCheck size={32} className="text-slate-300" />
        <p className="text-sm font-medium">Admin access required.</p>
        <p className="text-xs">Enable Admin Mode using the toggle in the sidebar.</p>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cases" element={<CustomerCases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/follow-up" element={<FollowUpCenter />} />
          <Route path="/truck-roll" element={<TruckRollCenter />} />
          <Route path="/internal-waiting" element={<InternalWaitingBoard />} />
          <Route path="/escalation" element={<EscalationCenter />} />
          <Route path="/notifications" element={<NotificationCenter />} />
          <Route path="/templates" element={<TemplateLibrary />} />
          <Route path="/kpi"       element={<AdminGuard><KPICenter /></AdminGuard>} />
          <Route path="/executive" element={<AdminGuard><ExecutiveDashboard /></AdminGuard>} />
          <Route path="/testing"   element={<AdminGuard><TestingCenter /></AdminGuard>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
