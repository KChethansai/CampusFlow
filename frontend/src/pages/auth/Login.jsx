import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/useAuth';
import { Input } from '../../components/ui/primitives';
import { btnClass } from '../../system/tokens';
import AuthLayout from './AuthLayout';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, error, loginUser, clearError } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => () => clearError(), [clearError]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async ({ email, password }) => {
    try {
      await loginUser(email, password);
      toast.success('Welcome back!');
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      // Unverified accounts are a dead-end without admin help — say so plainly.
      toast.error(/verif/i.test(msg) ? 'Account not verified yet. Contact your administrator.' : msg);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your digital campus."
      footer={<>New here? Accounts are provisioned by your institution administrator.</>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email address"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@institution.edu"
          error={errors.email && 'Enter your email'}
          {...register('email', { required: true })}
        />
        <Input
          label="Password"
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password && 'Enter your password'}
          {...register('password', { required: true })}
        />
        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className={btnClass('primary', 'large') + ' w-full'}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-center text-sm">
          <Link to="/forgot-password" className="text-[var(--cf-ink-mute)] hover:text-primary-600 transition">Forgot password?</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Login;
