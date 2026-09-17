// Profile: brutal identity — header card, tabs for overview/activity/security.
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
import { btnClass, cn, inputClass, labelClass } from '../system/tokens';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'security', label: 'Password & sessions' }
];

const brutalInput = cn(inputClass,
  'border-2 border-[var(--cf-ink)] rounded-[10px] shadow-brutal-sm focus:ring-[3px] focus:ring-[#0055ff] focus:border-[#0055ff]');

export default function Profile() {
  const { user, changePassword, logoutUser } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [tab, setTab] = useState('overview');
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

  const stats = [
    { Icon: GraduationCap, label: 'Assignments', v: activity?.assignments, bg: 'bg-royal' },
    { Icon: Briefcase, label: 'Applications', v: activity?.applications, bg: 'bg-gold' },
    { Icon: Inbox, label: 'Requests', v: activity?.requests, bg: 'bg-volt' }
  ];

  return (
    <motion.div {...staggerParent(0.07)} initial="initial" animate="animate" className="max-w-3xl mx-auto">
      {/* Brutal header */}
      <motion.div variants={staggerChild}>
        <section className="card-brutal rounded-2xl overflow-hidden mb-4">
          <div className="bg-royal px-5 pt-5 pb-10 relative" aria-hidden>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.9) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            <span className="relative brutal-tag bg-volt text-coal text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              Digital identity
            </span>
          </div>
          <div className="px-5 pb-5">
            <div className="flex flex-wrap items-end gap-4 -mt-8 relative">
              <span className="w-20 h-20 rounded-2xl bg-gold text-coal border-2 border-[var(--cf-ink)] shadow-brutal grid place-items-center text-3xl font-display font-bold" aria-hidden>
                {user.name?.[0]?.toUpperCase()}
              </span>
              <div className="flex-1 min-w-[12rem]">
                <h1 className="font-display text-2xl font-bold tracking-tight">{user.name}</h1>
                <p className="text-sm text-[var(--cf-ink-mute)]">{user.email}</p>
              </div>
              <span className={roleBadge(user.role)}>{user.role?.replace(/_/g, ' ')}</span>
            </div>
            <div className="racing-stripe h-2 rounded-full border-2 border-[var(--cf-ink)] mt-4" aria-hidden />
          </div>
        </section>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 mb-4 rounded-[12px] border-2 border-[var(--cf-ink)] bg-[var(--cf-surface)] shadow-brutal-sm" role="tablist" aria-label="Profile sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn('flex-1 px-3 py-2 rounded-[8px] text-xs font-display font-semibold transition-all border-2',
              tab === t.id ? 'bg-frame text-volt border-frame dark:bg-volt dark:text-coal' : 'border-transparent text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)]')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <motion.div variants={staggerChild}>
            <Card>
              <h2 className="font-display font-semibold mb-3">Identity</h2>
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
          <motion.div variants={staggerChild}>
            <Card>
              <h2 className="font-display font-semibold mb-1 flex items-center gap-1.5"><Award size={16} className="text-amber-500" /> Achievements</h2>
              <p className="text-sm text-[var(--cf-ink-mute)]">Milestones from placements and academics will live here.</p>
              <div className="mt-2"><Badge status={user.isActive === false ? 'inactive' : 'active'}>{user.isActive === false ? 'Inactive' : 'Active member'}</Badge></div>
            </Card>
          </motion.div>
        </div>
      )}

      {tab === 'activity' && (
        <motion.div variants={staggerChild}>
          <Card>
            <h2 className="font-display font-semibold mb-1">Activity</h2>
            <p className="text-xs text-[var(--cf-ink-mute)] mb-4">Live counts from your assignments, applications and requests.</p>
            <div className="grid grid-cols-3 gap-3">
              {stats.map(({ Icon, label, v, bg }) => (
                <div key={label} className="rounded-[12px] border-2 border-[var(--cf-ink)] bg-[var(--cf-surface-2)] p-3 text-center shadow-brutal-sm">
                  <span className={cn('mx-auto w-8 h-8 grid place-items-center rounded-[8px] border-2 border-[var(--cf-ink)] text-coal', bg)} aria-hidden>
                    <Icon size={15} className={bg === 'bg-royal' ? 'text-white' : undefined} />
                  </span>
                  <p className="font-display text-xl font-bold mt-2 tabular-nums">{v ?? '—'}</p>
                  <p className="text-[11px] text-[var(--cf-ink-mute)]">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {tab === 'security' && (
        <motion.div variants={staggerChild}>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold flex items-center gap-1.5"><ShieldCheck size={16} className="text-green-600" /> Security</h2>
              <button onClick={() => setShowPw((v) => !v)} className={btnClass('secondary', 'small')}>
                {showPw ? 'Cancel' : 'Change password'}
              </button>
            </div>
            {showPw ? (
              <form onSubmit={handleSubmit(onPassword)} className="space-y-3">
                <div>
                  <label className={labelClass} htmlFor="pw-current">Current password</label>
                  <input id="pw-current" type="password" autoComplete="current-password" className={brutalInput}
                    aria-describedby={errors.currentPassword ? 'pw-current-error' : undefined}
                    {...register('currentPassword', { required: true })} />
                  {errors.currentPassword && <p id="pw-current-error" role="alert" className="mt-1 text-xs font-medium text-flag">Enter your current password</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="pw-new">New password</label>
                  <input id="pw-new" type="password" autoComplete="new-password" className={brutalInput}
                    aria-describedby={errors.newPassword ? 'pw-new-error' : undefined}
                    {...register('newPassword', { required: true, minLength: { value: 8, message: 'Minimum 8 characters' } })} />
                  {errors.newPassword && <p id="pw-new-error" role="alert" className="mt-1 text-xs font-medium text-flag">{errors.newPassword.message}</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="pw-confirm">Confirm new password</label>
                  <input id="pw-confirm" type="password" autoComplete="new-password" className={brutalInput}
                    aria-describedby={errors.confirm ? 'pw-confirm-error' : undefined}
                    {...register('confirm', { required: true, validate: (v, f) => v === f.newPassword || 'Passwords do not match' })} />
                  {errors.confirm && <p id="pw-confirm-error" role="alert" className="mt-1 text-xs font-medium text-flag">{errors.confirm.message}</p>}
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
      )}
    </motion.div>
  );
}
