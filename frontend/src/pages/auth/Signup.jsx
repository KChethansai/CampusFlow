// Signup wires the existing POST /auth/register (admin-provisioned path stays valid).
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/useAuth';
import { Input, Select } from '../../components/ui/primitives';
import { ROLES } from '../../system/tokens';
import { btnClass } from '../../system/tokens';
import AuthLayout from './AuthLayout';

const SELF_SERVE_ROLES = ROLES.filter((r) => r !== 'super_admin');

export default function Signup() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, error, registerUser } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { role: 'student' }
  });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (values) => {
    try {
      await registerUser(values);
      toast.success('Welcome to CampusFlow!');
      navigate('/onboarding', { replace: true });
    } catch {
      toast.error('Could not create account. Your institution may provision accounts — contact your administrator.');
    }
  };

  return (
    <AuthLayout
      title="Join your campus"
      subtitle="One identity for academics, placements and campus life."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-primary-600 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Full name" id="name" autoComplete="name" placeholder="Aarav Sharma"
          error={errors.name && 'Enter your name'} {...register('name', { required: true, minLength: 2 })} />
        <Input label="Email address" id="email" type="email" autoComplete="email" placeholder="you@institution.edu"
          error={errors.email && 'Enter a valid email'} {...register('email', { required: true })} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Role" id="role" {...register('role', { required: true })}>
            {SELF_SERVE_ROLES.map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </Select>
          <Input label="Password" id="password" type="password" autoComplete="new-password" placeholder="8+ characters"
            error={errors.password && 'Minimum 8 characters'} {...register('password', { required: true, minLength: 8 })} />
        </div>
        {error && <div role="alert" className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>}
        <button type="submit" disabled={loading} className={btnClass('primary', 'large') + ' w-full'}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
