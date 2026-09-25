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

const MISCONFIGURED_TEXT = 'Service misconfigured — contact your administrator.';

const isMisconfiguredFailure = (err) => {
  if (err?.isApiBaseMisconfigured === true) return true;
  const msg = err?.response?.data?.message;
  return (
    err?.response?.status === 404 &&
    typeof msg === 'string' &&
    msg.includes('Route not found') &&
    msg.includes('/auth/login')
  );
};

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

  // The store keeps the raw backend message; map a misconfigured-base 404 to
  // the friendly text so the alert never shows "Route not found: /auth/login".
  const displayError =
    error && /route not found/i.test(error) && error.includes('/auth/login')
      ? MISCONFIGURED_TEXT
      : error;

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
      if (isMisconfiguredFailure(err)) {
        toast.error(MISCONFIGURED_TEXT);
      } else {
        const msg = err.response?.data?.message || 'Login failed';
        toast.error(
          /verif/i.test(msg)
            ? 'Account not verified yet. Contact your administrator.'
            : msg
        );
      }
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
          {ROLE_TABS.map((r, ri) => {
            const active = roleTab === r.value;
            return (
              <button
                key={r.value}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => handleRoleChange(r.value)}
                onKeyDown={(e) => {
                  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
                    : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
                  if (e.key === 'Home') { e.preventDefault(); handleRoleChange(ROLE_TABS[0].value); document.querySelector(`[data-role-tab="${ROLE_TABS[0].value}"]`)?.focus(); return; }
                  if (e.key === 'End') { e.preventDefault(); handleRoleChange(ROLE_TABS[ROLE_TABS.length - 1].value); document.querySelector(`[data-role-tab="${ROLE_TABS[ROLE_TABS.length - 1].value}"]`)?.focus(); return; }
                  if (!dir) return;
                  e.preventDefault();
                  const next = ROLE_TABS[(ri + dir + ROLE_TABS.length) % ROLE_TABS.length];
                  handleRoleChange(next.value);
                  document.querySelector(`[data-role-tab="${next.value}"]`)?.focus();
                }}
                data-role-tab={r.value}
                className={cn(
                  'relative px-2 py-1.5 min-h-11 rounded-xl text-xs font-display font-semibold transition-colors duration-200 focus-visible:outline-[2px] focus-visible:outline-[var(--cf-focus)]',
                  active
                    ? 'text-white dark:text-[#100D0B]'
                    : 'text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)]'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="cf-auth-role-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="absolute inset-0 rounded-xl bg-[var(--cf-accent-strong)] dark:bg-[var(--cf-accent)] shadow-[var(--cf-glow-ember)]"
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
          {displayError && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="rounded-[14px] border border-red-500/30 bg-red-500/[.06] px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
                {displayError}
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
              <span>Signing in…</span>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight size={16} aria-hidden />
              </>
            )}
          </MagneticButton>
        </div>

        <div className="pt-1 text-center">
          <Link
            to="/forgot-password"
            className="inline-block px-3 py-1.5 text-xs text-[var(--cf-ink-mute)] hover:text-[#D86D3E] underline underline-offset-4 transition"
          >
            Forgot your password?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Login;
