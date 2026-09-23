import { Routes, Route, Navigate, Link } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from './store/useAuth';
import ProtectedRoute from './components/routing/ProtectedRoute';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import AuthLayout from './pages/auth/AuthLayout';
import Onboarding from './pages/auth/Onboarding';
import { ForgotPassword, ResetPassword } from './pages/auth/PasswordReset';
import Dashboard from './pages/Dashboard';
import Users from './pages/admin/Users';
import AIReports from './pages/admin/AIReports';
import Departments from './pages/admin/Departments';
import Institutions from './pages/admin/Institutions';
import Courses from './pages/admin/Courses';
import Subjects from './pages/academic/Subjects';
import Assignments from './pages/academic/Assignments';
import Attendance from './pages/academic/Attendance';
import MyEnrollments from './pages/academic/MyEnrollments';
import Placement from './pages/placement/Placement';
import Requests from './pages/requests/Requests';
import Profile from './pages/Profile';
import Directory from './pages/Directory';
import Events from './pages/Events';
import Study from './pages/Study';
import { btnClass, emptyState } from './styles/common';
import AppErrorBoundary from './components/ui/AppErrorBoundary';
import NotFound from './pages/NotFound';

// No self-registration — accounts are provisioned by the institution admin.
function NoSelfSignup() {
  return (
    <AuthLayout
      title="No self-registration"
      subtitle="Accounts are created by your institution admin — contact them."
      footer={<Link to="/login" className="font-semibold text-[#D86D3E] underline underline-offset-2 hover:brightness-110">Back to sign in</Link>}
    >
      <p className={emptyState}>Ask your admin for an account, then sign in.</p>
      <Link to="/login" className={btnClass('primary', 'large') + ' w-full mt-4'}>Sign in →</Link>
    </AuthLayout>
  );
}

const adminRoles = ['super_admin', 'college_admin'];
const learnRoles = [...adminRoles, 'faculty', 'student'];

function HomeRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Landing />;
  try {
    if (!localStorage.getItem('cf_onboarding')) return <Navigate to="/onboarding" replace />;
  } catch { /* storage unavailable — let dashboard through */ }
  return <Navigate to="/dashboard" replace />;
}

function RequireOnboarding({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return children;
  try {
    if (!localStorage.getItem('cf_onboarding')) {
      return <Navigate to="/onboarding" replace />;
    }
  } catch { /* ignore */ }
  return children;
}

function App() {
  const loadUserFromStorage = useAuth((state) => state.loadUserFromStorage);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  return (
    <AppErrorBoundary>
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<NoSelfSignup />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <Layout />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/events" element={<Events />} />
        <Route
          path="/study"
          element={
            <ProtectedRoute allowedRoles={learnRoles}>
              <Study />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={adminRoles}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <ProtectedRoute allowedRoles={adminRoles}>
              <Departments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/institutions"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Institutions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute allowedRoles={adminRoles}>
              <Courses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects"
          element={
            <ProtectedRoute allowedRoles={[...adminRoles, 'faculty']}>
              <Subjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute allowedRoles={[...adminRoles, 'faculty', 'student']}>
              <Assignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={[...adminRoles, 'faculty', 'student']}>
              <Attendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement"
          element={
            <ProtectedRoute
              allowedRoles={[...adminRoles, 'placement_officer', 'student']}
            >
              <Placement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enrollments"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <MyEnrollments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-reports"
          element={
            <ProtectedRoute allowedRoles={adminRoles}>
              <AIReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute allowedRoles={[...adminRoles, 'faculty', 'student']}>
              <Requests />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Onboarding: authenticated but outside the app shell */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
    </AppErrorBoundary>
  );
}

export default App;
