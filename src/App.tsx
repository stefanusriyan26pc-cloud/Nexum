/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectsProvider } from './contexts/ProjectsContext';
import { ApiDataProvider } from './contexts/ApiDataContext';
import { RequireAuth } from './routes/RequireAuth';

// Lazy load pages for better code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Projects = lazy(() => import('./pages/Projects'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Finance = lazy(() => import('./pages/Finance'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Debug = lazy(() => import('./pages/Debug'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-primary)]" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent-primary)] animate-loader-dot" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent-primary)] animate-loader-dot" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent-primary)] animate-loader-dot" />
        </div>
        <p className="text-[var(--color-text-muted)] text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ApiDataProvider>
        <ProjectsProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Debug Route (public) */}
          <Route path="/debug" element={<Debug />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Main App Routes */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/tasks"
            element={
              <RequireAuth>
                <Tasks />
              </RequireAuth>
            }
          />
          <Route
            path="/projects"
            element={
              <RequireAuth>
                <Projects />
              </RequireAuth>
            }
          />
          <Route
            path="/calendar"
            element={
              <RequireAuth>
                <Calendar />
              </RequireAuth>
            }
          />
          <Route
            path="/finance"
            element={
              <RequireAuth>
                <Finance />
              </RequireAuth>
            }
          />
          <Route
            path="/analytics"
            element={
              <RequireAuth>
                <Analytics />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </ProjectsProvider>
      </ApiDataProvider>
    </BrowserRouter>
  );
}
