import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/useAuth';
import { cn } from '../../system/tokens';
import { Input } from '../../components/ui/primitives';
import PasswordInput from '../../components/visual/PasswordInput';
import MagneticButton from '../../components/visual/MagneticButton';
import AuthLayout from './AuthLayout';

const ROLE_TABS = [
  { value: 'student', label: 'Student', hint: 'student@institution.edu' },
  { value: 'faculty', label: 'Faculty', hint: 'faculty@institution.edu' },
  { value: 'college_admin', label: 'Admin', hint: 'admin@institution.edu' },
  { value: 'placement_officer', label: 'Placement', hint: 'placement@institution.edu' }
];

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, error, loginUser, clearError } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm();

  const [roleTab, setRoleTab] = useState(() => {
    try {
      return localStorage.getItem('cf_login_role') || 'student';
    } catch {
      return 'student';
    }
  });

  useEffect(() => () => clearError(), [clearError]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRoleChange = (role) => {
    setRoleTab(role);
    try {
      localStorage.setItem('cf_login_role', role);
    } catch {
      // storage unavailable
    }
  };

  const onSubmit = async ({ email, password }) => {
    try {
      await loginUser(email, password);
      toast.success('Welcome back!');
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(
        /verif/i.test(msg)
          ? 'Account not verified yet. Contact your administrator.'
          : msg
      );
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your campus workspace."
      footer={
        <>
          Accounts are provisioned by your institution. Need access?{' '}
          <span className="text-[var(--cf-ink)] font-medium">
            Contact your department administrator.
          </span>
        </>
      }
    >
      {/* Role Selection Tabs */}
      <div className="mb-6">
        <label className="block mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--cf-ink-mute)]">
          Account Role
        </label>
        <div
          role="tablist"
          aria-label="I am signing in as"
          className="grid grid-cols-4 gap-1 p-1 rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60 backdrop-blur-md"
        >
          {ROLE_TABS.map((r) => {
            const active = roleTab === r.value;
            return (
              <button
                key={r.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleRoleChange(r.value)}
                className={cn(
                  'relative px-2 py-1.5 rounded-xl text-xs font-display font-semibold transition-colors duration-200 focus-visible:outline-[2px] focus-visible:outline-[#D86D3E]',
                  active
                    ? 'text-white'
                    : 'text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)]'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="cf-auth-role-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="absolute inset-0 rounded-xl bg-[#D86D3E] shadow-[0_2px_10px_rgba(216,109,62,0.4)]"
                    aria-hidden
                  />
                )}
                <span className="relative z-10">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Institutional Email"
          id="email"
          type="email"
          autoComplete="email"
          placeholder={
            ROLE_TABS.find((r) => r.value === roleTab)?.hint || 'you@institution.edu'
          }
          error={errors.email && 'Enter your institutional email address'}
          {...register('email', { required: true })}
        />

        <PasswordInput
          label="Password"
          id="password"
          autoComplete="current-password"
          placeholder="Enter your account password"
          error={errors.password && 'Enter your password'}
          {...register('password', { required: true })}
        />

        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="rounded-[14px] border border-red-500/30 bg-red-500/[.06] px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-2">
          <MagneticButton
            type="submit"
            disabled={loading}
            className="w-full h-12 text-sm"
          >
            {loading ? (
              <span>Authenticating…</span>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight size={16} aria-hidden />
              </>
            )}
          </MagneticButton>
        </div>

        {/* SSO Divider */}
        <div
          className="flex items-center gap-3 pt-2 text-[11px] font-mono uppercase tracking-widest text-[var(--cf-ink-mute)]"
          aria-hidden
        >
          <span className="h-px flex-1 bg-[var(--cf-line)]" />
          <span>Institution SSO</span>
          <span className="h-px flex-1 bg-[var(--cf-line)]" />
        </div>

        {/* Single Sign-On Options */}
        <div className="grid grid-cols-2 gap-2.5">
          {['Google Workspace', 'Microsoft 365'].map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => toast('SSO federation is managed by your campus administrator.')}
              className="rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 px-3 py-2.5 text-xs font-display font-semibold text-[var(--cf-ink-soft)] hover:text-[var(--cf-ink)] hover:border-black/20 dark:hover:border-white/20 transition-all duration-200"
            >
              {provider}
            </button>
          ))}
        </div>

        <div className="pt-1 text-center">
          <Link
            to="/forgot-password"
            className="text-xs text-[var(--cf-ink-mute)] hover:text-[#D86D3E] underline underline-offset-4 transition"
          >
            Forgot your password?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Login;
