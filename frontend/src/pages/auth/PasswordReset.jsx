import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/useAuth';
import { Input } from '../../components/ui/primitives';
import { btnClass } from '../../system/tokens';
import AuthLayout from './AuthLayout';

export function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async ({ email }) => {
    await forgotPassword(email);
    // Always 200 (enumeration-safe); token may arrive via email OR in-app notification.
    setSent(true);
    toast.success('If the account exists, reset instructions are on their way.');
  };

  return (
    <AuthLayout title="Reset password" subtitle="We’ll send reset instructions to your email — or your CampusFlow inbox if mail isn’t configured."
      footer={<><Link to="/login" className="font-medium text-primary-600 hover:underline">Back to sign in</Link></>}>
      {sent ? (
        <div className="text-sm text-[var(--cf-ink-soft)] space-y-2">
          <p>Check your email for a reset link (valid ~10 minutes).</p>
          <p>No email? Open <Link to="/login" className="text-primary-600 hover:underline">notifications after signing in</Link> — the token may be waiting there.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Email address" id="email" type="email" autoComplete="email" placeholder="you@institution.edu" {...register('email', { required: true })} />
          <button type="submit" className={btnClass('primary', 'large') + ' w-full'}>Send reset link</button>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPassword() {
  const { resetPassword } = useAuth();
  const [done, setDone] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

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
      footer={<><Link to="/login" className="font-medium text-primary-600 hover:underline">Back to sign in</Link></>}>
      {done ? (
        <Link to="/login" className={btnClass('primary', 'large') + ' w-full'}>Continue to sign in</Link>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Reset token" id="token-view" value={token} readOnly />
          <Input label="New password" id="password" type="password" autoComplete="new-password"
            error={errors.password && 'Minimum 8 characters'}
            {...register('password', { required: true, minLength: 8 })} />
          <Input label="Confirm password" id="confirm" type="password" autoComplete="new-password"
            error={errors.confirm && 'Passwords must match'}
            {...register('confirm', { required: true, validate: (v) => v === watch('password') })} />
          <button type="submit" className={btnClass('primary', 'large') + ' w-full'}>Update password</button>
        </form>
      )}
    </AuthLayout>
  );
}
