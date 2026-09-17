import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/useAuth';
import { btnClass, cn, labelClass } from '../../system/tokens';
import AuthLayout from './AuthLayout';

const ROLE_TABS = [
  { value: 'student', label: 'Student', hint: 'you@institution.edu' },
  { value: 'faculty', label: 'Faculty', hint: 'faculty@institution.edu' },
  { value: 'college_admin', label: 'Admin', hint: 'admin@institution.edu' },
  { value: 'placement_officer', label: 'Placement', hint: 'placement@institution.edu' }
];

const brutalInput = (hasError) => cn(
  'w-full px-3.5 py-2.5 text-sm bg-[var(--cf-surface)] text-[var(--cf-ink)] placeholder:text-[var(--cf-ink-mute)] rounded-[10px] border-2 shadow-brutal-sm transition-all',
  'focus:outline-none focus:ring-[3px] focus:ring-[#0055ff] focus:border-[#0055ff]',
  hasError ? 'border-flag' : 'border-[var(--cf-ink)]'
);

function BrutalField({ id, label, error, errorId, ...props }) {
  const describedBy = error ? errorId : undefined;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <input
        id={id}
        className={brutalInput(Boolean(error))}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />
      {error && <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-flag">{error}</p>}
    </div>
  );
}

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
      footer={<>New here? <Link to="/signup" className="font-semibold text-[var(--cf-ink)] underline decoration-volt decoration-2 underline-offset-2 hover:decoration-royal">Create account</Link></>}
    >
      <div role="tablist" aria-label="I am signing in as" className="grid grid-cols-4 gap-1.5 p-1.5 mb-5 rounded-[12px] border-2 border-[var(--cf-ink)] bg-[var(--cf-surface-2)]">
        {ROLE_TABS.map((r) => {
          const active = roleTab === r.value;
          return (
            <button
              key={r.value}
              role="tab"
              aria-selected={active}
              onClick={() => { setRoleTab(r.value); try { localStorage.setItem('cf_login_role', r.value); } catch {} }}
              className={cn('relative px-2 py-1.5 rounded-[8px] text-xs font-display font-semibold transition-all border-2',
                active ? 'bg-gold text-coal border-frame shadow-brutal-sm' : 'border-transparent text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)]')}
            >
              {active && <motion.span layoutId="cf-role-pill" transition={{ type: 'spring', stiffness: 350, damping: 25 }} className="absolute inset-0 rounded-[6px] bg-gold -z-0" aria-hidden />}
              <span className="relative">{r.label}</span>
            </button>
          );
        })}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <BrutalField
          label="Email address"
          id="email"
          type="email"
          autoComplete="email"
          placeholder={ROLE_TABS.find((r) => r.value === roleTab)?.hint || 'you@institution.edu'}
          error={errors.email && 'Enter your email'}
          errorId="email-error"
          {...register('email', { required: true })}
        />
        <BrutalField
          label="Password"
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password && 'Enter your password'}
          errorId="password-error"
          {...register('password', { required: true })}
        />
        {error && (
          <div role="alert" className="border-2 border-[var(--cf-ink)] border-l-8 border-l-flag bg-[var(--cf-surface-2)] px-4 py-3 rounded-[10px] text-sm font-medium">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className={btnClass('primary', 'large') + ' w-full'}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
        <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-[var(--cf-ink-mute)]" aria-hidden>
          <span className="h-0.5 flex-1 bg-[var(--cf-ink)]" /><span>Institution SSO</span><span className="h-0.5 flex-1 bg-[var(--cf-ink)]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['Google', 'Microsoft'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toast('SSO is provisioned by your administrator.')}
              className="px-3 py-2 rounded-[10px] border-2 border-[var(--cf-ink)] bg-[var(--cf-surface)] shadow-brutal-sm text-sm font-display font-semibold hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
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
