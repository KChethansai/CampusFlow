import { Routes, Route, Navigate, Link } from 'react-router';
import { Suspense, lazy, useEffect } from 'react';
import { useAuth } from './store/useAuth';
import ProtectedRoute from './components/routing/ProtectedRoute';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import AuthLayout from './pages/auth/AuthLayout';
import Onboarding from './pages/auth/Onboarding';
import { ForgotPassword, ResetPassword } from './pages/auth/PasswordReset';
import { btnClass, emptyState } from './styles/common';
import AppErrorBoundary from './components/ui/AppErrorBoundary';
import { ChunkErrorBoundary } from './components/data/LazyRetry';
import { LoadingState } from './components/ui/primitives';
import NotFound from './pages/NotFound';

// Route-split: authenticated pages load on demand. Auth-critical routes
// (Landing/Login/Onboarding/PasswordReset/NotFound) stay eager so first
// paint and the server-authoritative gate never wait on a chunk.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/admin/Users'));
const AIReports = lazy(() => import('./pages/admin/AIReports'));
const Departments = lazy(() => import('./pages/admin/Departments'));
const Institutions = lazy(() => import('./pages/admin/Institutions'));
const Courses = lazy(() => import('./pages/admin/Courses'));
const Subjects = lazy(() => import('./pages/academic/Subjects'));
const Schedule = lazy(() => import('./pages/academic/Schedule'));
const Assignments = lazy(() => import('./pages/academic/Assignments'));
const Attendance = lazy(() => import('./pages/academic/Attendance'));
const MyEnrollments = lazy(() => import('./pages/academic/MyEnrollments'));
const Placement = lazy(() => import('./pages/placement/Placement'));
const Requests = lazy(() => import('./pages/requests/Requests'));
const Profile = lazy(() => import('./pages/Profile'));
const Directory = lazy(() => import('./pages/Directory'));
const Events = lazy(() => import('./pages/Events'));
const Study = lazy(() => import('./pages/Study'));

function PageFallback() {
  return (
    <div className="min-h-[60vh] grid place-items-center" role="status" aria-label="Loading page">
      <LoadingState label="Loading…" />
    </div>
  );
}

// Stale precached shell + rotated chunk hashes make a lazy route import
// reject; React caches the rejection, so the only recovery is a reload
// onto fresh chunk URLs (same recovery as the boot stale-shell card).
function PageLoadError() {
  return (
    <div className="min-h-[60vh] grid place-items-center" role="alert">
      <div className="text-center">
        <p className="font-display font-semibold text-[var(--cf-ink)]">This page failed to load.</p>
        <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">Your saved copy may be out of date.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={btnClass('primary', 'medium') + ' mt-4'}
        >
          Reload latest version
        </button>
      </div>
    </div>
  );
}

// No self-registration — accounts are provisioned by the institution admin.
function NoSelfSignup() {
  return (
    <AuthLayout
      title="No self-registration"
      subtitle="Accounts are created by your institution admin — contact them."
       footer={<Link to="/login" className="font-semibold text-[var(--cf-accent)] underline underline-offset-2 hover:brightness-110">Back to sign in</Link>}
    >
      <p className={emptyState}>Ask your admin for an account, then sign in.</p>
      <Link to="/login" className={btnClass('primary', 'large') + ' w-full mt-4'}>Sign in →</Link>
    </AuthLayout>
  );
}

const adminRoles = ['super_admin', 'college_admin'];
const learnRoles = [...adminRoles, 'faculty', 'student'];

// The user record from /auth/me is the ONLY authority for mandatory profile
// completion. localStorage is never consulted: a fresh browser, incognito
// window, cleared storage, or new device must NOT route an existing user into
// the questionnaire. A user is only onboarding when the server says so.
const profileComplete = (user) => {
  if (!user) return false;
  if (user.onboardingCompleted) return true;
  const profile = user.profile || {};
  if (['faculty', 'hod'].includes(user.role)) return Boolean(user.department);
  if (user.role === 'student') {
    return Boolean(
      user.institution && user.department
      && profile.rollNumber && profile.course
      && profile.semester && profile.batchYear,
    );
  }
  return Boolean(user.institution);
};

const needsOnboarding = (user) => Boolean(user) && !profileComplete(user);

function HomeRoute() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Landing />;
  if (needsOnboarding(user)) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/dashboard" replace />;
}

function RequireOnboarding({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return children;
  if (needsOnboarding(user)) return <Navigate to="/onboarding" replace />;
  return children;
}

function App() {
  const loadUserFromStorage = useAuth((state) => state.loadUserFromStorage);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  return (
    <AppErrorBoundary>
    <ChunkErrorBoundary fallback={<PageLoadError />}>
    <Suspense fallback={<PageFallback />}>
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
            <ProtectedRoute allowedRoles={[...adminRoles, 'hod', 'faculty']}>
              <Subjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute allowedRoles={[...adminRoles, 'hod', 'faculty', 'student']}>
              <Schedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute allowedRoles={[...adminRoles, 'hod', 'faculty', 'student']}>
              <Assignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={[...adminRoles, 'hod', 'faculty', 'student']}>
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
            <ProtectedRoute allowedRoles={[...adminRoles, 'hod', 'faculty', 'student']}>
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
    </Suspense>
    </ChunkErrorBoundary>
    </AppErrorBoundary>
  );
}

export default App;
