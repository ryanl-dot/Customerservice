import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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
import { AdminProvider } from './context/AdminContext';

export default function App() {
  return (
    <AdminProvider>
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
            <Route path="/kpi" element={<KPICenter />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AdminProvider>
  );
}
