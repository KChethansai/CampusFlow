// ProtectedRoute: auth gate + role gate with a real 403 instead of silent redirect.
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../store/useAuth';
import { btnClass } from '../../system/tokens';

export function Forbidden() {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <ShieldAlert size={40} className="mx-auto text-amber-500" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Permission denied</h1>
      <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
        Your role doesn’t have access to this area. Contact your administrator if you need it.
      </p>
      <Link to="/dashboard" className={btnClass('primary', 'medium') + ' mt-6'}>
        Back to dashboard
      </Link>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Forbidden />;
  }

  return children;
}

export default ProtectedRoute;
