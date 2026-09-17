import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/useAuth';
import { btnClass, cn } from '../../system/tokens';
import { Input, Select } from '../../components/ui/primitives';
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
const STRENGTH_BG = ['bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-[#2563FF]', 'bg-green-500'];

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
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-[#2563FF] underline underline-offset-2 hover:brightness-110">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div role="tablist" aria-label="Register as" className="grid grid-cols-3 gap-1 p-1.5 rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60">
          {ROLES.map((r) => {
            const active = watchedRole === r.value;
            return (
              <button
                key={r.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setValue('role', r.value, { shouldValidate: true })}
                className={cn('relative px-2 py-1.5 rounded-xl text-xs font-display font-semibold transition',
                  active ? 'bg-[#2563FF] text-white' : 'text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)]')}
              >
                {active && <motion.span layoutId="cf-reg-role" transition={{ type: 'spring', stiffness: 350, damping: 25 }} className="absolute inset-0 rounded-xl bg-[#2563FF]" aria-hidden />}
                <span className="relative">{r.label}</span>
              </button>
            );
          })}
        </div>
        <Input
          label="Full name"
          id="name"
          autoComplete="name"
          placeholder="Aarav Kumar"
          error={errors.name && 'Enter your full name'}
          {...register('name', { required: true })}
        />
        <Input
          label="Email address"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@institution.edu"
          error={errors.email && 'Enter a valid email'}
          {...register('email', { required: true })}
        />
        <div>
          <Input
            label="Password"
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password && 'Password must be at least 8 characters'}
            {...register('password', { required: true, minLength: 8 })}
          />
          <AnimatePresence initial={false}>
            {watchedPw && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60 p-2.5" aria-live="polite">
                  <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', STRENGTH_BG[strength])}
                      initial={false}
                      animate={{ width: `${(strength / 4) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-display font-semibold">Strength: {STRENGTH_LABEL[strength]}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Select
          label="Role"
          id="role"
          error={errors.role && 'Pick a role'}
          {...register('role', { required: true })}
        >
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Department"
            id="department"
            placeholder="CSE"
            {...register('department')}
          />
          <Input
            label="ID / Roll number"
            id="rollNumber"
            placeholder="SITCSE001"
            {...register('rollNumber')}
          />
        </div>
        <Input
          label="Institution code (optional)"
          id="institutionCode"
          placeholder="SIT"
          {...register('institutionCode')}
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
          {loading ? 'Creating account…' : 'Create account →'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Register;
