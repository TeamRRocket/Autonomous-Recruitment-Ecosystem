import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import SetPassword from './pages/SetPassword';
import CandidateOnboarding from './pages/onboarding/CandidateOnboarding';
import RecruiterOnboarding from './pages/onboarding/RecruiterOnboarding';
import RequireProfile from './components/RequireProfile';
import CreateEditJob from './pages/jobs/CreateEditJob';
import JobDetails from './pages/jobs/JobDetails';
import Jobs from './pages/jobs/Jobs';
import JobCreationWizard from './pages/jobs/JobCreationWizard';
import DashboardLayout from './layouts/DashboardLayout';
import RecruiterApplications from './pages/applications/RecruiterApplications';
import CandidateApplications from './pages/applications/CandidateApplications';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';
import RecruiterJobRanking from './pages/RecruiterJobRanking';
import RecruiterCodingBuilder from './pages/coding/RecruiterCodingBuilder';
import CandidateCodingRound from './pages/coding/CandidateCodingRound';
import { useLocation } from 'react-router-dom';

const ApplicationsPage = () => {
  const { user } = useAuth();
  return user?.role === 'RECRUITER' ? <RecruiterApplications /> : <CandidateApplications />;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-300 bg-slate-900">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (user.isPasswordSet === false && location.pathname !== '/set-password') {
    return <Navigate to="/set-password" />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (!loading && user) {
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
          <Toaster position="top-center" toastOptions={{
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155'
            },
          }} />
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route path="/set-password" element={
              <ProtectedRoute>
                <SetPassword />
              </ProtectedRoute>
            } />

            {/* Onboarding Routes (No Sidebar) */}
            <Route path="/onboarding/candidate" element={
              <ProtectedRoute>
                <CandidateOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/recruiter" element={
              <ProtectedRoute>
                <RecruiterOnboarding />
              </ProtectedRoute>
            } />

            {/* Main Application Routes Wrapped in DashboardLayout */}
            <Route element={
              <ProtectedRoute>
                <RequireProfile>
                  <DashboardLayout />
                </RequireProfile>
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/new" element={<JobCreationWizard />} />
              <Route path="/jobs/:id/edit" element={<CreateEditJob />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/recruiter/rank-candidates" element={<RecruiterJobRanking />} />
              <Route path="/recruiter/dsa-builder" element={<RecruiterCodingBuilder />} />
              <Route path="/coding/round/:roundId" element={<CandidateCodingRound />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Profile />} /> {/* Placeholder */}
            </Route>

          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
