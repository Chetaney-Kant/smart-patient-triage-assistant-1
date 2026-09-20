import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DisclaimerBanner } from './components/DisclaimerBanner';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { NewTriageWizard } from './pages/patient/NewTriageWizard';
import { MedicalProfilePage } from './pages/patient/MedicalProfilePage';
import { PrivacyCenterPage } from './pages/patient/PrivacyCenterPage';
import { ClinicianLiveQueuePage } from './pages/clinician/ClinicianLiveQueuePage';
import { EmergencyConsolePage } from './pages/emergency/EmergencyConsolePage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { SafetySuitePage } from './pages/admin/SafetySuitePage';
import { SafetyLimitationsPage } from './pages/common/SafetyLimitationsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Authenticating session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/patient/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <DisclaimerBanner />
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/safety-limitations" element={<SafetyLimitationsPage />} />

          {/* Patient Routes */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/triage/new"
            element={
              <ProtectedRoute>
                <NewTriageWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute>
                <MedicalProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/privacy"
            element={
              <ProtectedRoute>
                <PrivacyCenterPage />
              </ProtectedRoute>
            }
          />

          {/* Clinician Routes */}
          <Route
            path="/clinician/queue"
            element={
              <ProtectedRoute roles={['ROLE_CLINICIAN', 'ROLE_ADMIN']}>
                <ClinicianLiveQueuePage />
              </ProtectedRoute>
            }
          />

          {/* Emergency Console */}
          <Route
            path="/emergency"
            element={
              <ProtectedRoute roles={['ROLE_EMERGENCY_OPERATOR', 'ROLE_CLINICIAN', 'ROLE_ADMIN', 'ROLE_PATIENT']}>
                <EmergencyConsolePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute roles={['ROLE_ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/safety-suite"
            element={
              <ProtectedRoute roles={['ROLE_ADMIN']}>
                <SafetySuitePage />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/patient/dashboard" replace />} />
        </Routes>
      </main>

      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>Healthcare — Smart Patient Triage Assistant • Prototype Hackathon Platform</div>
          <div className="flex gap-4">
            <a href="/safety-limitations" className="hover:underline">Safety Policy</a>
            <a href="/api-docs" target="_blank" rel="noreferrer" className="hover:underline">API Docs (OpenAPI)</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
