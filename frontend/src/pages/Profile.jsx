// Profile: glass identity — header card, tabs for overview/activity/security.
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Award, Briefcase, GraduationCap, Inbox, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../store/useAuth';
import { Badge, Card, Input, LoadingState } from '../components/ui/primitives';
import { staggerChild, staggerParent } from '../system/motion';
import { btnClass, cn, inputClass, labelClass, roleBadge } from '../system/tokens';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Password & sessions' }
];

const notificationKinds = [
  ['assignment', 'Assignments'], ['event', 'Events'], ['announcement', 'Announcements'],
  ['request', 'Requests'], ['placement', 'Placement'], ['account', 'Account'], ['system', 'System']
];
const defaultPreferences = Object.fromEntries(notificationKinds.map(([key]) => [key, { inApp: true, push: true, email: true }]));

export default function Profile() {
  const reduced = useReducedMotion();
  const { user, changePassword, logoutUser } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [tab, setTab] = useState('overview');
  const [activity, setActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [notificationPrefs, setNotificationPrefs] = useState(defaultPreferences);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
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
      setActivityLoading(false);
    })();
    return () => { live = false; };
  }, []);

  useEffect(() => {
    let live = true;
    api.get('/notifications/preferences')
      .then(({ data }) => {
        if (live) setNotificationPrefs({ ...defaultPreferences, ...(data.data?.preferences || data.data || {}) });
      })
      .catch(() => { if (live) toast.error('Could not load notification preferences'); })
      .finally(() => { if (live) setPrefsLoading(false); });
    return () => { live = false; };
  }, []);

  const saveNotificationPrefs = async () => {
    setPrefsSaving(true);
    try {
      const { data } = await api.patch('/notifications/preferences', { preferences: notificationPrefs });
      const saved = data.data?.preferences || data.data;
      if (saved) setNotificationPrefs({ ...defaultPreferences, ...saved });
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save notification preferences');
    } finally { setPrefsSaving(false); }
  };

  const onPassword = async ({ currentPassword, newPassword }) => {
    try {
      await changePassword(currentPassword, newPassword);
      // Server revokes every session on password change, so the current
      // tokens are dead — sign out locally instead of leaving a stale session.
      toast.success('Password changed. Please log in again.');
      reset();
      setShowPw(false);
      await logoutUser();
      window.location.href = '/login';
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
    { Icon: GraduationCap, label: 'Assignments', v: activity?.assignments, tint: 'bg-[#D86D3E]/10 text-[#D86D3E]' },
    { Icon: Briefcase, label: 'Applications', v: activity?.applications, tint: 'bg-[#C87D4B]/12 text-[#9E4B29] dark:text-[#E7A66D]' },
    { Icon: Inbox, label: 'Requests', v: activity?.requests, tint: 'bg-[#D86D3E]/12 text-[#B6532B] dark:text-[#F5B08A]' }
  ];

  return (
    <motion.div {...(reduced ? {} : staggerParent(0.07))} initial={reduced ? false : 'initial'} animate="animate" className="max-w-3xl mx-auto">
      {/* Glass header */}
      <motion.div variants={reduced ? undefined : staggerChild}>
        <section className="rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/80 backdrop-blur-xl overflow-hidden mb-4">
          <div className="px-5 pt-5 pb-10 relative" aria-hidden>
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(420px 200px at 15% 0%, rgba(216,109,62,.14), transparent 65%), radial-gradient(360px 200px at 90% 10%, rgba(167,123,104,.10), transparent 65%)'
              }}
            />
            <span className="relative inline-flex items-center gap-1.5 rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E7A66D]" aria-hidden />
              Digital identity
            </span>
          </div>
          <div className="px-5 pb-5">
            <div className="flex flex-wrap items-end gap-4 -mt-8 relative">
              <span className="w-20 h-20 rounded-3xl bg-[#A94727] text-white border border-[#D86D3E]/30 grid place-items-center text-3xl font-display font-bold" aria-hidden>
                {user.name?.[0]?.toUpperCase()}
              </span>
              <div className="flex-1 min-w-[12rem]">
                <h1 className="font-display text-2xl font-bold tracking-tight">{user.name}</h1>
                <p className="text-sm text-[var(--cf-ink-mute)]">{user.email}</p>
              </div>
              <span className={roleBadge(user.role)}>{user.role?.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </section>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1.5 mb-4 rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 backdrop-blur" role="group" aria-label="Profile sections">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              aria-pressed={active}
              onClick={() => setTab(t.id)}
              className={cn('relative min-w-fit flex-1 px-3 py-2 rounded-xl text-xs font-display font-semibold transition',
                active ? 'text-white' : 'text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)]')}
            >
              {active && <motion.span layoutId="cf-profile-tab" transition={{ type: 'spring', stiffness: 350, damping: 25 }} className="absolute inset-0 rounded-xl bg-[#D86D3E]" aria-hidden />}
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
      {tab === 'overview' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <motion.div variants={reduced ? undefined : staggerChild}>
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
          <motion.div variants={reduced ? undefined : staggerChild}>
            <Card>
              <h2 className="font-display font-semibold mb-1 flex items-center gap-1.5"><Award size={16} className="text-amber-500" /> Achievements</h2>
              <p className="text-sm text-[var(--cf-ink-mute)]">Milestones from placements and academics will live here.</p>
              <div className="mt-2"><Badge status={user.isActive === false ? 'inactive' : 'active'}>{user.isActive === false ? 'Inactive' : 'Active member'}</Badge></div>
            </Card>
          </motion.div>
        </div>
      )}

      {tab === 'activity' && (
        <motion.div variants={reduced ? undefined : staggerChild}>
          <Card>
            <h2 className="font-display font-semibold mb-1">Activity</h2>
            <p className="text-xs text-[var(--cf-ink-mute)] mb-4">Live counts from your assignments, applications and requests.</p>
            {activityLoading ? <LoadingState label="Loading activity…" /> :
            <div className="grid grid-cols-3 gap-3">
              {stats.map(({ Icon, label, v, tint }) => (
                <div key={label} className="rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/50 p-3 text-center">
                  <span className={cn('mx-auto w-8 h-8 grid place-items-center rounded-xl', tint)} aria-hidden>
                    <Icon size={15} />
                  </span>
                  <p className="font-display text-xl font-bold mt-2 tabular-nums">{v ?? '—'}</p>
                  <p className="text-[11px] text-[var(--cf-ink-mute)]">{label}</p>
                </div>
              ))}
            </div>}
          </Card>
        </motion.div>
      )}

      {tab === 'notifications' && (
        <motion.div variants={reduced ? undefined : staggerChild}>
          <Card>
            <h2 className="font-display font-semibold mb-1">Notification channels</h2>
            <p className="text-xs text-[var(--cf-ink-mute)] mb-4">Choose how each update reaches you. Realtime means an active browser session; email is included in the weekly digest.</p>
            {prefsLoading ? <LoadingState label="Loading preferences…" /> : <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <thead><tr className="border-b border-[var(--cf-line)] text-left text-xs text-[var(--cf-ink-mute)]"><th scope="col" className="py-2 pr-3">Type</th><th scope="col" className="p-2 text-center">In app</th><th scope="col" className="p-2 text-center">Realtime</th><th scope="col" className="p-2 text-center">Weekly email</th></tr></thead>
                  <tbody className="divide-y divide-[var(--cf-line)]">{notificationKinds.map(([key, label]) => <tr key={key}>
                    <th scope="row" className="py-2.5 pr-3 text-left font-medium">{label}</th>
                    {['inApp', 'push', 'email'].map((channel) => <td key={channel} className="p-2 text-center"><input
                      type="checkbox" checked={Boolean(notificationPrefs[key]?.[channel])}
                      aria-label={`${label}: ${channel === 'inApp' ? 'in app' : channel === 'push' ? 'realtime browser' : 'weekly email'}`}
                      onChange={(event) => setNotificationPrefs((current) => ({ ...current, [key]: { ...current[key], [channel]: event.target.checked } }))}
                      className="h-4 w-4 accent-[#D86D3E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cf-accent)]"
                    /></td>)}
                  </tr>)}</tbody>
                </table>
              </div>
              <button type="button" disabled={prefsSaving || prefsLoading} onClick={saveNotificationPrefs} className={btnClass('primary', 'medium') + ' mt-4'}>{prefsSaving ? 'Saving…' : 'Save preferences'}</button>
            </>}
          </Card>
        </motion.div>
      )}

      {tab === 'security' && (
        <motion.div variants={reduced ? undefined : staggerChild}>
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
                  <input id="pw-current" type="password" autoComplete="current-password" className={inputClass}
                    aria-describedby={errors.currentPassword ? 'pw-current-error' : undefined}
                    {...register('currentPassword', { required: true })} />
                  {errors.currentPassword && <p id="pw-current-error" role="alert" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">Enter your current password</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="pw-new">New password</label>
                  <input id="pw-new" type="password" autoComplete="new-password" className={inputClass}
                    aria-describedby={errors.newPassword ? 'pw-new-error' : undefined}
                    {...register('newPassword', { required: true, minLength: { value: 8, message: 'Minimum 8 characters' } })} />
                  {errors.newPassword && <p id="pw-new-error" role="alert" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.newPassword.message}</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="pw-confirm">Confirm new password</label>
                  <input id="pw-confirm" type="password" autoComplete="new-password" className={inputClass}
                    aria-describedby={errors.confirm ? 'pw-confirm-error' : undefined}
                    {...register('confirm', { required: true, validate: (v, f) => v === f.newPassword || 'Passwords do not match' })} />
                  {errors.confirm && <p id="pw-confirm-error" role="alert" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.confirm.message}</p>}
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
      </AnimatePresence>
    </motion.div>
  );
}
