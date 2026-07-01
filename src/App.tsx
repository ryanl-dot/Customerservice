import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sun } from 'lucide-react';
import Layout from './components/Layout';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import RequirePage from './auth/RequirePage';
import { defaultLandingPage } from '../shared/auth/permissions';
import Login from './pages/Login';
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

const PAGE_PATH: Record<string, string> = {
  dashboard: '/', cases: '/cases', 'follow-up': '/follow-up', 'truck-roll': '/truck-roll',
  'internal-waiting': '/internal-waiting', escalation: '/escalation', notifications: '/notifications',
  templates: '/templates', kpi: '/kpi', executive: '/executive', testing: '/testing',
  'admin-users': '/',
};

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-100 text-slate-400">
      <div className="w-9 h-9 bg-amber-400 rounded-md flex items-center justify-center animate-pulse">
        <Sun size={18} className="text-slate-900" />
      </div>
      <p className="text-sm">Checking your session…</p>
    </div>
  );
}

// After login, send the user to their role's default landing page (executives → /executive).
function LandingRedirect() {
  const { role } = useAuth();
  const target = role ? PAGE_PATH[defaultLandingPage(role)] : '/';
  return <Navigate to={target} replace />;
}

function AuthenticatedApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RequirePage page="dashboard"><Dashboard /></RequirePage>} />
        <Route path="/cases" element={<RequirePage page="cases"><CustomerCases /></RequirePage>} />
        <Route path="/cases/:id" element={<RequirePage page="cases"><CaseDetail /></RequirePage>} />
        <Route path="/follow-up" element={<RequirePage page="follow-up"><FollowUpCenter /></RequirePage>} />
        <Route path="/truck-roll" element={<RequirePage page="truck-roll"><TruckRollCenter /></RequirePage>} />
        <Route path="/internal-waiting" element={<RequirePage page="internal-waiting"><InternalWaitingBoard /></RequirePage>} />
        <Route path="/escalation" element={<RequirePage page="escalation"><EscalationCenter /></RequirePage>} />
        <Route path="/notifications" element={<RequirePage page="notifications"><NotificationCenter /></RequirePage>} />
        <Route path="/templates" element={<RequirePage page="templates"><TemplateLibrary /></RequirePage>} />
        <Route path="/kpi" element={<RequirePage page="kpi"><KPICenter /></RequirePage>} />
        <Route path="/executive" element={<RequirePage page="executive"><ExecutiveDashboard /></RequirePage>} />
        <Route path="/testing" element={<RequirePage page="testing"><TestingCenter /></RequirePage>} />
        <Route path="/welcome" element={<LandingRedirect />} />
      </Routes>
    </Layout>
  );
}

function Gate() {
  const { status } = useAuth();
  if (status === 'loading') return <LoadingScreen />;
  if (status === 'unauthenticated') return <Login />;
  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </AuthProvider>
  );
}
