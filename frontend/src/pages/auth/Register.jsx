import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/useAuth';
import { Input, Select } from '../../components/ui/primitives';
import { btnClass, cn } from '../../system/tokens';
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
      footer={<>Already have an account? <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div role="tablist" aria-label="Register as" className="relative grid grid-cols-3 gap-1 p-1 rounded-full border border-[var(--cf-line)] bg-black/[.03] dark:bg-white/[.05]">
          {ROLES.map((r) => {
            const active = watchedRole === r.value;
            return (
              <button
                key={r.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setValue('role', r.value, { shouldValidate: true })}
                className={cn('relative px-2 py-1.5 rounded-full text-xs font-medium transition', active ? 'text-white' : 'text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)]')}
              >
                {active && <motion.span layoutId="cf-reg-role" transition={{ type: 'spring', stiffness: 350, damping: 25 }} className="absolute inset-0 rounded-full bg-primary-600 shadow-glow" aria-hidden />}
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
          className="cf-glow-focus"
          {...register('name', { required: true })}
        />
        <Input
          label="Email address"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@institution.edu"
          error={errors.email && 'Enter a valid email'}
          className="cf-glow-focus"
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
            className="cf-glow-focus"
            {...register('password', { required: true, minLength: 8 })}
          />
          {watchedPw && (
            <div className="mt-2" aria-live="polite">
              <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', strength <= 1 ? 'bg-red-500' : strength === 2 ? 'bg-amber-500' : strength === 3 ? 'bg-primary-500' : 'bg-green-500')}
                  initial={false}
                  animate={{ width: `${(strength / 4) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              </div>
              <p className="mt-1 text-[11px] text-[var(--cf-ink-mute)]">Strength: {STRENGTH_LABEL[strength]}</p>
            </div>
          )}
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
        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className={btnClass('primary', 'large') + ' w-full'}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Register;
