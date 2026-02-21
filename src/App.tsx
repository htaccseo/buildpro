import React from 'react';
// Force rebuild: 2026-02-09T11:40
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Schedule } from './pages/Schedule';
import { Invoices } from './pages/Invoices';
import { Team } from './pages/Team';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';
import { useStore } from './lib/store';
import { LandingPage } from './pages/LandingPage';

import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { SuperAdminRoute } from './components/SuperAdminRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useStore();
  return currentUser ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

// Smart Scroll Restoration
function ScrollToTop() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    // Exempt deep linking: hashes (#task-123) or specific query params (?taskId=...)
    if (location.hash || searchParams.has('taskId') || searchParams.has('modal')) {
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: 'auto'
    });
  }, [location.pathname, location.hash, searchParams]);

  return null;
}

function App() {
  const { fetchData, currentUser } = useStore();
  const [isRestoring, setIsRestoring] = React.useState(true);

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('meits_user_email');
    if (savedEmail && !currentUser) {
      fetchData(savedEmail).finally(() => setIsRestoring(false));
    } else {
      setIsRestoring(false);
    }
  }, []);

  if (isRestoring) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login initialMode="signup" />} />
        <Route
          path="/admin"
          element={
            <ErrorBoundary>
              <SuperAdminRoute>
                <Layout>
                  <SuperAdminDashboard />
                </Layout>
              </SuperAdminRoute>
            </ErrorBoundary>
          }
        />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/team" element={<Team />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
