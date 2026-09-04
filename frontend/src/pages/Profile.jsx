// Profile: premium digital identity — identity, role, academics, placement, security.
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Award, Briefcase, GraduationCap, Inbox, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../store/useAuth';
import { Badge, Card, LoadingState } from '../components/ui/primitives';
import { roleBadge } from '../system/tokens';
import { staggerChild, staggerParent } from '../system/motion';
import { btnClass, inputClass, labelClass } from '../system/tokens';

export default function Profile() {
  const { user, changePassword, logoutUser } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [activity, setActivity] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    let live = true;
    (async () => {
      const [a, j, r] = await Promise.allSettled([
        api.get('/assignments'), api.get('/job-applications'), api.get('/requests')
      ]);
      if (!live) return;
      setActivity({
        assignments: a.status === 'fulfilled' ? (a.value.data.data || []).length : null,
        applications: j.status === 'fulfilled' ? (j.value.data.data || []).length : null,
        requests: r.status === 'fulfilled' ? (r.value.data.data || []).length : null
      });
    })();
    return () => { live = false; };
  }, []);

  const onPassword = async ({ currentPassword, newPassword }) => {
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed. All other sessions were signed out.');
      reset();
      setShowPw(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const academic = [
    ['Roll number', user?.profile?.rollNumber],
    ['Course', user?.profile?.course],
    ['Semester', user?.profile?.semester],
    ['Section', user?.profile?.section],
    ['Batch year', user?.profile?.batchYear],
    ['CGPA', user?.profile?.cgpa],
    ['Backlogs', user?.profile?.backlogs],
    ['Designation', user?.profile?.designation],
    ['Qualification', user?.profile?.qualification],
    ['Phone', user?.profile?.phone]
  ].filter(([, v]) => v != null && v !== '');

  if (!user) return <LoadingState />;

  return (
    <motion.div {...staggerParent(0.07)} initial="initial" animate="animate" className="max-w-3xl mx-auto">
      <motion.div variants={staggerChild}>
        <Card className="relative overflow-hidden mb-4">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-violet" aria-hidden />
          <div className="relative pt-12">
            <div className="flex flex-wrap items-end gap-4">
              <span className="w-20 h-20 rounded-3xl bg-[var(--cf-surface)] border-4 border-[var(--cf-surface)] shadow-3 grid place-items-center text-3xl font-extrabold text-primary-600 -mt-2" aria-hidden>
                {user.name?.[0]?.toUpperCase()}
              </span>
              <div className="flex-1 min-w-[12rem]">
                <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                <p className="text-sm text-[var(--cf-ink-mute)]">{user.email}</p>
              </div>
              <span className={roleBadge(user.role)}>{user.role?.replace(/_/g, ' ')}</span>
            </div>
            {(activity?.assignments != null || activity?.applications != null || activity?.requests != null) && (
              <div className="grid grid-cols-3 gap-2 mt-5">
                {[
                  { Icon: GraduationCap, label: 'Assignments', v: activity.assignments },
                  { Icon: Briefcase, label: 'Applications', v: activity.applications },
                  { Icon: Inbox, label: 'Requests', v: activity.requests }
                ].map(({ Icon, label, v }) => (
                  <div key={label} className="rounded-xl bg-black/[.03] dark:bg-white/[.05] p-3 text-center">
                    <Icon size={16} className="mx-auto text-primary-500" aria-hidden />
                    <p className="text-xl font-bold mt-1">{v ?? '—'}</p>
                    <p className="text-[11px] text-[var(--cf-ink-mute)]">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div variants={staggerChild}>
          <Card>
            <h2 className="font-semibold mb-3">Identity</h2>
            <dl className="space-y-2.5 text-sm">
              {academic.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-1 border-b border-[var(--cf-line)] last:border-0">
                  <dt className="text-[var(--cf-ink-mute)]">{k}</dt>
                  <dd className="font-medium capitalize text-right">{String(v)}</dd>
                </div>
              ))}
              {academic.length === 0 && <p className="text-sm text-[var(--cf-ink-mute)]">No additional details on file.</p>}
            </dl>
          </Card>
        </motion.div>

        <motion.div variants={staggerChild} className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-1 flex items-center gap-1.5"><Award size={16} className="text-amber-500" /> Achievements</h2>
            <p className="text-sm text-[var(--cf-ink-mute)]">Milestones from placements and academics will live here.</p>
            <div className="mt-2"><Badge status={user.isActive === false ? 'inactive' : 'active'}>{user.isActive === false ? 'Inactive' : 'Active member'}</Badge></div>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-1.5"><ShieldCheck size={16} className="text-green-600" /> Security</h2>
              <button onClick={() => setShowPw((v) => !v)} className={btnClass('secondary', 'small')}>
                {showPw ? 'Cancel' : 'Change password'}
              </button>
            </div>
            {showPw ? (
              <form onSubmit={handleSubmit(onPassword)} className="space-y-3">
                <div>
                  <label className={labelClass} htmlFor="pw-current">Current password</label>
                  <input id="pw-current" type="password" autoComplete="current-password" className={inputClass}
                    {...register('currentPassword', { required: true })} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="pw-new">New password</label>
                  <input id="pw-new" type="password" autoComplete="new-password" className={inputClass}
                    {...register('newPassword', { required: true, minLength: { value: 8, message: 'Minimum 8 characters' } })} />
                  {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="pw-confirm">Confirm new password</label>
                  <input id="pw-confirm" type="password" autoComplete="new-password" className={inputClass}
                    {...register('confirm', { required: true, validate: (v, f) => v === f.newPassword || 'Passwords do not match' })} />
                  {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>}
                </div>
                <button type="submit" className={btnClass('primary', 'medium') + ' w-full'}>Update password</button>
              </form>
            ) : (
              <p className="text-sm text-[var(--cf-ink-mute)]">Changing your password signs out every other session.</p>
            )}
            <button
              onClick={async () => { await logoutUser(); window.location.href = '/login'; }}
              className={btnClass('outline', 'small') + ' mt-3'}
            >
              Sign out everywhere
            </button>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
