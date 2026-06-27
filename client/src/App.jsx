import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import VoiceNavigator from './components/ai/VoiceNavigator';
import AIAdvisor from './components/ai/AIAdvisor';
import NHCCLayout from './layouts/NHCCLayout';
import FinaraLayout from './layouts/FinaraLayout';
import Login from './pages/Login';

// NHCC Pages
import NHCCDashboard from './pages/nhcc/Dashboard';
import Projects from './pages/nhcc/Projects';
import Tasks from './pages/nhcc/Tasks';
import Documents from './pages/nhcc/Documents';
import Messages from './pages/nhcc/Messages';
import Calendar from './pages/nhcc/Calendar';
import Announcements from './pages/nhcc/Announcements';
import Approvals from './pages/nhcc/Approvals';
import SiteReports from './pages/nhcc/SiteReports';
import Reports from './pages/nhcc/Reports';
import UserManagement from './pages/nhcc/UserManagement';

// Finara Pages
import FinaraDashboard from './pages/finara/Dashboard';
import Income from './pages/finara/Income';
import Expenses from './pages/finara/Expenses';
import Analytics from './pages/finara/Analytics';
import Goals from './pages/finara/Goals';
import Accounts from './pages/finara/Accounts';
import Investments from './pages/finara/Investments';
import Settings from './pages/finara/Settings';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  const [advisorOpen, setAdvisorOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <Routes>
      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      {/* NHCC Portal Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><NHCCLayout><NHCCDashboard /></NHCCLayout></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><NHCCLayout><Projects /></NHCCLayout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><NHCCLayout><Tasks /></NHCCLayout></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><NHCCLayout><Documents /></NHCCLayout></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><NHCCLayout><Messages /></NHCCLayout></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><NHCCLayout><Calendar /></NHCCLayout></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><NHCCLayout><Announcements /></NHCCLayout></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute><NHCCLayout><Approvals /></NHCCLayout></ProtectedRoute>} />
      <Route path="/site-reports" element={<ProtectedRoute><NHCCLayout><SiteReports /></NHCCLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><NHCCLayout><Reports /></NHCCLayout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><NHCCLayout><UserManagement /></NHCCLayout></ProtectedRoute>} />

      {/* Finara Routes */}
      <Route path="/finara/dashboard" element={<ProtectedRoute><FinaraLayout><FinaraDashboard /></FinaraLayout></ProtectedRoute>} />
      <Route path="/finara/income" element={<ProtectedRoute><FinaraLayout><Income /></FinaraLayout></ProtectedRoute>} />
      <Route path="/finara/expenses" element={<ProtectedRoute><FinaraLayout><Expenses /></FinaraLayout></ProtectedRoute>} />
      <Route path="/finara/analytics" element={<ProtectedRoute><FinaraLayout><Analytics /></FinaraLayout></ProtectedRoute>} />
      <Route path="/finara/goals" element={<ProtectedRoute><FinaraLayout><Goals /></FinaraLayout></ProtectedRoute>} />
      <Route path="/finara/accounts" element={<ProtectedRoute><FinaraLayout><Accounts /></FinaraLayout></ProtectedRoute>} />
      <Route path="/finara/investments" element={<ProtectedRoute><FinaraLayout><Investments /></FinaraLayout></ProtectedRoute>} />
      <Route path="/finara/settings" element={<ProtectedRoute><FinaraLayout><Settings /></FinaraLayout></ProtectedRoute>} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
          <div className="text-center">
            <p className="text-6xl font-bold text-slate-200 dark:text-slate-700">404</p>
            <p className="text-slate-500 mt-2">Page not found</p>
            <a href="/dashboard" className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">Go to Dashboard</a>
          </div>
        </div>
      } />
    </Routes>

    {/* Global AI Overlays — only show when logged in */}
    {user && (
      <>
        <VoiceNavigator onOpenAdvisor={() => setAdvisorOpen(true)} />
        <AIAdvisor isOpen={advisorOpen} onClose={() => setAdvisorOpen(false)} />
      </>
    )}
    </>
  );
}
