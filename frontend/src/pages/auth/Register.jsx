import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/useAuth';
import { btnClass, cn, labelClass } from '../../system/tokens';
import AuthLayout from './AuthLayout';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'placement_officer', label: 'Placement Officer' },
];

const strengthOf = (pw = '') => {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  return Math.min(4, s);
};
const STRENGTH_LABEL = ['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
const STRENGTH_BG = ['bg-flag', 'bg-flag', 'bg-gold', 'bg-royal', 'bg-green-500'];

const brutalInput = (hasError) => cn(
  'w-full px-3.5 py-2.5 text-sm bg-[var(--cf-surface)] text-[var(--cf-ink)] placeholder:text-[var(--cf-ink-mute)] rounded-[10px] border-2 shadow-brutal-sm transition-all',
  'focus:outline-none focus:ring-[3px] focus:ring-[#0055ff] focus:border-[#0055ff]',
  hasError ? 'border-flag' : 'border-[var(--cf-ink)]'
);

function BrutalField({ id, label, error, errorId, ...props }) {
  return (
    <div>
      {label && <label htmlFor={id} className={labelClass}>{label}</label>}
      <input
        id={id}
        className={brutalInput(Boolean(error))}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-flag">{error}</p>}
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, error, registerUser, clearError } = useAuth();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { role: 'student' },
  });
  const watchedRole = watch('role', 'student');
  const watchedPw = watch('password', '');
  const strength = strengthOf(watchedPw);

  useEffect(() => () => clearError(), [clearError]);

  if (isAuthenticated) {
    return <Navigate to="/onboarding" replace />;
  }

  const onSubmit = async (form) => {
    try {
      await registerUser(form);
      toast.success('Account created — tell us about yourself');
      navigate('/onboarding', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.details?.[0]?.message
        || 'Registration failed';
      toast.error(msg);
    }
  };

  return (
    <AuthLayout
      title="Join your campus"
      subtitle="Create your CampusFlow account."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-[var(--cf-ink)] underline decoration-volt decoration-2 underline-offset-2 hover:decoration-royal">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div role="tablist" aria-label="Register as" className="grid grid-cols-3 gap-1.5 p-1.5 rounded-[12px] border-2 border-[var(--cf-ink)] bg-[var(--cf-surface-2)]">
          {ROLES.map((r) => {
            const active = watchedRole === r.value;
            return (
              <button
                key={r.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setValue('role', r.value, { shouldValidate: true })}
                className={cn('relative px-2 py-1.5 rounded-[8px] text-xs font-display font-semibold transition-all border-2',
                  active ? 'bg-gold text-coal border-frame shadow-brutal-sm' : 'border-transparent text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)]')}
              >
                {active && <motion.span layoutId="cf-reg-role" transition={{ type: 'spring', stiffness: 350, damping: 25 }} className="absolute inset-0 rounded-[6px] bg-gold" aria-hidden />}
                <span className="relative">{r.label}</span>
              </button>
            );
          })}
        </div>
        <BrutalField
          label="Full name"
          id="name"
          autoComplete="name"
          placeholder="Aarav Kumar"
          error={errors.name && 'Enter your full name'}
          errorId="name-error"
          {...register('name', { required: true })}
        />
        <BrutalField
          label="Email address"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@institution.edu"
          error={errors.email && 'Enter a valid email'}
          errorId="email-error"
          {...register('email', { required: true })}
        />
        <div>
          <BrutalField
            label="Password"
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password && 'Password must be at least 8 characters'}
            errorId="password-error"
            {...register('password', { required: true, minLength: 8 })}
          />
          {watchedPw && (
            <div className="mt-2 rounded-[10px] border-2 border-[var(--cf-ink)] bg-[var(--cf-surface-2)] p-2.5" aria-live="polite">
              <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden border border-[var(--cf-ink)]">
                <motion.div
                  className={cn('h-full rounded-full', STRENGTH_BG[strength])}
                  initial={false}
                  animate={{ width: `${(strength / 4) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              </div>
              <p className="mt-1 text-[11px] font-display font-semibold">Strength: {STRENGTH_LABEL[strength]}</p>
            </div>
          )}
        </div>
        <div>
          <label htmlFor="role" className={labelClass}>Role</label>
          <select
            id="role"
            className={brutalInput(Boolean(errors.role))}
            aria-invalid={Boolean(errors.role)}
            aria-describedby={errors.role ? 'role-error' : undefined}
            {...register('role', { required: true })}
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {errors.role && <p id="role-error" role="alert" className="mt-1.5 text-xs font-medium text-flag">Pick a role</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <BrutalField
            label="Department"
            id="department"
            placeholder="CSE"
            {...register('department')}
          />
          <BrutalField
            label="ID / Roll number"
            id="rollNumber"
            placeholder="SITCSE001"
            {...register('rollNumber')}
          />
        </div>
        <BrutalField
          label="Institution code (optional)"
          id="institutionCode"
          placeholder="SIT"
          {...register('institutionCode')}
        />
        {error && (
          <div role="alert" className="border-2 border-[var(--cf-ink)] border-l-8 border-l-flag bg-[var(--cf-surface-2)] px-4 py-3 rounded-[10px] text-sm font-medium">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className={btnClass('primary', 'large') + ' w-full'}>
          {loading ? 'Creating account…' : 'Create account →'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Register;
