import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useStore();
  return currentUser ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
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
