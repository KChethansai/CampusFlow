import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/useAuth';
import { btnClass, cn } from '../../system/tokens';
import { Input } from '../../components/ui/primitives';
import AuthLayout from './AuthLayout';

const ROLE_TABS = [
  { value: 'student', label: 'Student', hint: 'you@institution.edu' },
  { value: 'faculty', label: 'Faculty', hint: 'faculty@institution.edu' },
  { value: 'college_admin', label: 'Admin', hint: 'admin@institution.edu' },
  { value: 'placement_officer', label: 'Placement', hint: 'placement@institution.edu' }
];

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, error, loginUser, clearError } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [roleTab, setRoleTab] = useState(() => {
    try { return localStorage.getItem('cf_login_role') || 'student'; } catch { return 'student'; }
  });

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
      footer={<>New here? <Link to="/signup" className="font-semibold text-[#2563FF] underline underline-offset-2 hover:brightness-110">Create account</Link></>}
    >
      <div role="tablist" aria-label="I am signing in as" className="grid grid-cols-4 gap-1 p-1.5 mb-5 rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60">
        {ROLE_TABS.map((r) => {
          const active = roleTab === r.value;
          return (
            <button
              key={r.value}
              role="tab"
              aria-selected={active}
              onClick={() => { setRoleTab(r.value); try { localStorage.setItem('cf_login_role', r.value); } catch {} }}
              className={cn('relative px-2 py-1.5 rounded-xl text-xs font-display font-semibold transition',
                active ? 'bg-[#2563FF] text-white' : 'text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)]')}
            >
              {active && <motion.span layoutId="cf-role-pill" transition={{ type: 'spring', stiffness: 350, damping: 25 }} className="absolute inset-0 rounded-xl bg-[#2563FF]" aria-hidden />}
              <span className="relative">{r.label}</span>
            </button>
          );
        })}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email address"
          id="email"
          type="email"
          autoComplete="email"
          placeholder={ROLE_TABS.find((r) => r.value === roleTab)?.hint || 'you@institution.edu'}
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
        <button type="submit" disabled={loading} className={btnClass('primary', 'large') + ' w-full'}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
        <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-[var(--cf-ink-mute)]" aria-hidden>
          <span className="h-px flex-1 bg-[var(--cf-line)]" /><span>Institution SSO</span><span className="h-px flex-1 bg-[var(--cf-line)]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['Google', 'Microsoft'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toast('SSO is provisioned by your administrator.')}
              title="SSO is provisioned by your administrator"
              className="rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 px-3 py-2 text-sm font-display font-semibold text-[var(--cf-ink-soft)] hover:text-[var(--cf-ink)] hover:border-[var(--cf-ink-mute)] transition"
            >
              {p}
            </button>
          ))}
        </div>
        <p className="text-center text-sm">
          <Link to="/forgot-password" className="text-[var(--cf-ink-mute)] underline underline-offset-2 hover:text-[var(--cf-ink)] transition">Forgot password?</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Login;
