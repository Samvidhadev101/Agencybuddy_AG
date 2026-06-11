import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ChatbotWidget from './components/ChatbotWidget';
import ExitFeedbackGate from './components/ExitFeedbackGate';
import AiConnectionModal from './components/AiConnectionModal';
import TrialBanner from './components/TrialBanner';

// Pages imports
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Clients from './pages/clients/Clients';
import SEO from './pages/seo/SEO';
import GBP from './pages/gbp/GBP';
import AEO from './pages/aeo/AEO';
import Social from './pages/social/Social';
import Content from './pages/content/Content';
import EmailCRM from './pages/email/EmailCRM';
import Reputation from './pages/reputation/Reputation';
import Analytics from './pages/analytics/Analytics';
import Geofencing from './pages/geofencing/Geofencing';
import Tasks from './pages/tasks/Tasks';
import Team from './pages/team/Team';
import Billing from './pages/billing/Billing';
import Settings from './pages/settings/Settings';
import Support from './pages/support/Support';

function RoleProtectedRoute({ element, requiredModule, requireAdmin }) {
  const { userProfile } = useApp();

  const isDenied = userProfile?.role === 'custom' && (
    requireAdmin || (requiredModule && !userProfile.custom_permissions?.modules?.[requiredModule])
  );

  React.useEffect(() => {
    if (isDenied) {
      alert("You don't have access to this section.");
    }
  }, [isDenied]);

  if (isDenied) {
    return <Navigate to="/dashboard" replace />;
  }

  return element;
}

function AuthenticatedLayout() {
  const { userProfile } = useApp();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          {/* Top Bar */}
          <Topbar />
          
          {/* Page Scroll Content */}
          <div className="flex-1 overflow-y-auto bg-page-bg bg-grid-pattern p-6 relative">
            <TrialBanner />
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/new" element={<Clients />} />
              <Route path="/clients/:id" element={<Clients />} />
              <Route path="/clients/:id/edit" element={<Clients />} />
              <Route path="/seo/*" element={<RoleProtectedRoute requiredModule="seo" element={<SEO />} />} />
              <Route path="/gbp/*" element={<RoleProtectedRoute requiredModule="gbp" element={<GBP />} />} />
              <Route path="/aeo/*" element={<RoleProtectedRoute requiredModule="aeo" element={<AEO />} />} />
              <Route path="/social/*" element={<RoleProtectedRoute requiredModule="social" element={<Social />} />} />
              <Route path="/content/*" element={<RoleProtectedRoute requiredModule="content" element={<Content />} />} />
              <Route path="/email/*" element={<RoleProtectedRoute requiredModule="email" element={<EmailCRM />} />} />
              <Route path="/reputation/*" element={<RoleProtectedRoute requiredModule="reputation" element={<Reputation />} />} />
              <Route path="/analytics/*" element={<RoleProtectedRoute requiredModule="analytics" element={<Analytics />} />} />
              <Route path="/analytics/reports/export" element={<RoleProtectedRoute requiredModule="analytics" element={<Analytics />} />} />
              <Route path="/geofencing/*" element={<RoleProtectedRoute requiredModule="geofencing" element={<Geofencing />} />} />
              <Route path="/tasks/*" element={<Tasks />} />
              <Route path="/team/*" element={<Team />} />
              <Route path="/team/invite" element={<Team />} />
              <Route path="/billing/*" element={<RoleProtectedRoute requireAdmin={true} element={<Billing />} />} />
              <Route path="/settings/*" element={<RoleProtectedRoute requireAdmin={true} element={<Settings />} />} />
              <Route path="/support/*" element={<Support />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
      
      {/* Floating Chatbot Support */}
      <ChatbotWidget />
      
      {/* Exit questionnaire gate */}
      {userProfile?.role !== 'custom' && <ExitFeedbackGate />}

      {/* AI Connection Intercept Modal */}
      <AiConnectionModal />
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center font-sans select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-t-primary-cyan border-border-light animate-spin"></div>
          <span className="font-mono text-xs text-text-secondary">BOOTING OS ENGINE...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" replace />} />
      <Route path="/*" element={user ? <AuthenticatedLayout /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
