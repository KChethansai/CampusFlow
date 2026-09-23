import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/useAuth';
import { btnClass } from '../../system/tokens';
import { Input } from '../../components/ui/primitives';
import PasswordInput from '../../components/visual/PasswordInput';
import MagneticButton from '../../components/visual/MagneticButton';
import AuthLayout from './AuthLayout';

const backLink = <><Link to="/login" className="font-semibold text-[#D86D3E] underline underline-offset-4 hover:brightness-110">Back to sign in</Link></>;

export function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setFailed(false);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('If the account exists, reset instructions are on their way.');
    } catch {
      setFailed(true);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="We’ll send reset instructions to your institutional email."
      footer={backLink}>
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60 p-4 text-sm text-[var(--cf-ink-soft)] space-y-2"
          >
            <p className="flex items-center gap-1.5 font-display font-semibold text-[var(--cf-ink)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E7A66D]" aria-hidden />
              Check your inbox
            </p>
            <p>Reset link valid for ~10 minutes.</p>
            <p>No email? Sign in to check in-app notifications if local SMTP is unconfigured.</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <Input
              label="Institutional Email"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@institution.edu"
              error={errors.email && 'Enter your email'}
              {...register('email', { required: true })}
            />
            <AnimatePresence initial={false}>
              {failed && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-[14px] border border-red-500/30 bg-red-500/[.06] px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300"
                >
                  Couldn’t reach the server. Check your connection and try again.
                </motion.p>
              )}
            </AnimatePresence>
            <div className="pt-2">
              <MagneticButton type="submit" className="w-full h-11 text-sm">
                Send reset link →
              </MagneticButton>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}

export function ResetPassword() {
  const { resetPassword } = useAuth();
  const [done, setDone] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  if (!token && !done) {
    return (
      <AuthLayout title="Choose a new password" subtitle="Minimum 8 characters."
        footer={backLink}>
        <div className="text-sm text-[var(--cf-ink-soft)] space-y-3">
          <p>This page needs a reset token. Open it from the link in your email.</p>
          <Link to="/forgot-password" className={btnClass('outline', 'medium') + ' w-full'}>Request a new link</Link>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = async ({ password }) => {
    try {
      await resetPassword(token, password);
      setDone(true);
      toast.success('Password updated. Sign in again.');
    } catch {
      toast.error('Reset link is invalid or expired. Request a new one.');
    }
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="Minimum 8 characters."
      footer={backLink}>
      {done ? (
        <Link to="/login" className={btnClass('primary', 'large') + ' w-full'}>Continue to sign in →</Link>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Reset token" id="token-view" value={token} readOnly />
          <PasswordInput
            label="New password"
            id="password"
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            error={errors.password && 'Minimum 8 characters'}
            {...register('password', { required: true, minLength: 8 })}
          />
          <PasswordInput
            label="Confirm password"
            id="confirm"
            autoComplete="new-password"
            placeholder="Repeat the new password"
            error={errors.confirm && 'Passwords must match'}
            {...register('confirm', { required: true, validate: (v) => v === watch('password') })}
          />
          <div className="pt-2">
            <MagneticButton type="submit" className="w-full h-11 text-sm">
              Update password →
            </MagneticButton>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
