// StudentHome: hierarchical regions — R1 Academic Pulse hero (macro metric +
// radial gauge + trajectory), R2 workload analytics (Area), R3 assignments
// timeline stream, R4 actionable task cards.
// Endpoints preserved: GET /assignments, /attendance/student/:id,
// /job-applications, /notifications. Real data only.
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight, Briefcase, ClipboardList, GraduationCap } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/primitives';
import { AnimatedCounter } from '../../components/ui/editorial';
import { AttendanceRing, Sparkline } from '../../components/data/views';
import { staggerChild, staggerParent } from '../../system/motion';

const TrendChart = lazy(() =>
  import('../../components/data/TrendChart')
    .then((m) => ({ default: m.TrendChart || m.default }))
    .catch(() => ({ default: () => null }))
);

const fmtDay = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';
const dueIn = (d) => {
  const ms = new Date(d).getTime() - Date.now();
  if (ms <= 0) return 'due now';
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `in ${h}h`;
  const days = Math.floor(h / 24);
  return days === 1 ? 'in 1 day' : `in ${days} days`;
};

const HERO = 'cf-glass rounded-[24px] border border-[var(--cf-line)] p-6 sm:p-8 relative overflow-hidden';
const PANEL = 'cf-glass rounded-[24px] border border-[var(--cf-line)] p-5';
const TASK = 'rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface)] p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg';

export default function StudentHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notes, setNotes] = useState([]);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    const [a, s, j, n] = await Promise.allSettled([
      api.get('/assignments'),
      user?._id ? api.get(`/attendance/student/${user._id}`) : Promise.reject(new Error('no-id')),
      api.get('/job-applications'),
      api.get('/notifications')
    ]);
    let ok = false;
    if (a.status === 'fulfilled') { setAssignments(a.value.data.data || []); ok = true; }
    if (s.status === 'fulfilled') {
      const d = s.value.data.data;
      setAttendance(Array.isArray(d) ? d : d?.sessions || d?.records || []);
      ok = true;
    }
    if (j.status === 'fulfilled') { setApplications(j.value.data.data || []); ok = true; }
    if (n.status === 'fulfilled') { setNotes((n.value.data.data || []).filter((x) => !x.isRead).slice(0, 4)); ok = true; }
    if (!ok) setFailed(true);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return assignments
      .filter((x) => x.dueDate && new Date(x.dueDate).getTime() >= now && !['graded', 'archived'].includes(x.status))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [assignments]);

  const overdue = useMemo(() => {
    const now = Date.now();
    return assignments.filter((x) => x.dueDate && new Date(x.dueDate).getTime() < now && !['graded', 'closed', 'archived'].includes(x.status));
  }, [assignments]);

  // /attendance/student/:id returns per-subject aggregates:
  // [{subject, subjectId, totalSessions, present, absent, late, percentage}]
  const health = useMemo(() => {
    const total = attendance.reduce((n, s) => n + (s.totalSessions || 0), 0);
    if (!total) return null;
    const present = attendance.reduce((n, s) => n + (s.present || 0) + (s.late || 0), 0);
    return Math.round((present / total) * 100);
  }, [attendance]);

  const weakest = useMemo(() => {
    return [...attendance]
      .filter((s) => s.totalSessions > 0)
      .sort((a, b) => (a.percentage ?? 100) - (b.percentage ?? 100))
      .slice(0, 3);
  }, [attendance]);

  const trend = useMemo(() => {
    // Aggregates carry no time series — show per-subject rates instead.
    return attendance.filter((s) => s.totalSessions > 0).map((s) => Math.round(s.percentage ?? 0));
  }, [attendance]);

  // Workload trajectory: items due per day over the next 7 days (real due dates).
  const workload = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
    return days.map((d) => {
      const key = d.toDateString();
      const due = upcoming.filter((a) => a.dueDate && new Date(a.dueDate).toDateString() === key).length;
      return {
        day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        due
      };
    });
  }, [upcoming]);

  const peakLoad = useMemo(() => workload.reduce((m, w) => Math.max(m, w.due), 0), [workload]);

  // Timeline urgency buckets for the R3 stream.
  const buckets = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    const inBucket = (a) => {
      const ms = new Date(a.dueDate).getTime() - now;
      if (ms < day) return 'Today';
      if (ms < day * 7) return 'This Week';
      return 'Later';
    };
    const groups = { Today: [], 'This Week': [], Later: [] };
    upcoming.slice(0, 6).forEach((a) => { groups[inBucket(a)].push(a); });
    return groups;
  }, [upcoming]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return <LoadingState label="Assembling your day…" />;
  if (failed) return <ErrorState message="Couldn't load your dashboard." onRetry={load} />;

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      {/* REGION 1 — Hero Pulse: dominant macro-metric + radial gauge + trajectory */}
      <motion.section variants={staggerChild} className={HERO} aria-label="Academic pulse">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1 basis-64">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A7D700]" aria-hidden />
              Academic Pulse
            </p>
            <h1 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight">
              {greeting}, <em className="cf-display font-normal">{user?.name?.split(' ')[0]}.</em>
            </h1>
            <p className="mt-2 text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
              {health == null ? '—' : `${health}%`}
            </p>
            <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
              {health == null
                ? 'No attendance recorded yet.'
                : upcoming.length
                  ? `Next up: ${upcoming[0].title} — due ${fmtDay(upcoming[0].dueDate)}.`
                  : 'Nothing due right now. A rare, beautiful thing.'}
            </p>
            {overdue.length > 0 && (
              <Link to="/assignments" className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: '#FF5964' }}>
                <AlertTriangle size={13} aria-hidden /> {overdue.length} overdue — act now <ArrowRight size={13} aria-hidden />
              </Link>
            )}
          </div>
          {health != null && (
            <div className="flex flex-wrap items-center gap-6">
              <AttendanceRing value={health} />
              {trend.length > 1 && (
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--cf-ink-mute)] mb-1">Trajectory · by subject</p>
                  <Sparkline points={trend} width={200} height={64} />
                </div>
              )}
            </div>
          )}
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        {/* REGION 2 — primary analytics surface (~65%): workload trajectory */}
        <motion.section variants={staggerChild} className={`${PANEL} lg:col-span-2`} aria-label="Workload trajectory">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-base font-semibold flex items-center gap-2">
              <ClipboardList size={17} className="text-[#2563FF]" aria-hidden /> Workload trajectory
            </h2>
            <Link to="/assignments" className="text-xs font-medium text-[#2563FF] hover:underline">All assignments</Link>
          </div>
          <p className="text-xs text-[var(--cf-ink-mute)] mb-3">
            Due per day · next 7 days{peakLoad ? ` · peak ${peakLoad}/day` : ' · clear week ahead'}.
          </p>
          <Suspense fallback={<Sparkline points={workload.map((w) => w.due)} width={420} height={90} />}>
            <TrendChart data={workload} xKey="day" lines={[{ key: 'due', color: '#2563FF' }]} height={200} />
          </Suspense>
        </motion.section>

        {/* REGION 3 — activity stream (~35%): assignments timeline */}
        <motion.section variants={staggerChild} className={PANEL} aria-label="Assignments timeline">
          <h2 className="font-display text-base font-semibold mb-3">Due timeline</h2>
          {upcoming.length === 0 ? (
            <EmptyState title="Clear skies" hint="Check the placement board?" />
          ) : (
            <div className="space-y-4">
              {Object.entries(buckets).map(([label, items]) => (
                items.length > 0 && (
                  <div key={label}>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)] mb-1.5">{label}</p>
                    <ul className="space-y-1.5">
                      {items.map((a) => (
                        <li key={a._id}>
                          <Link to="/assignments" className="flex items-center gap-2 group">
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium truncate group-hover:text-[#2563FF] transition">{a.title}</span>
                              <span className="block text-xs text-[var(--cf-ink-mute)] tabular-nums">{dueIn(a.dueDate)}</span>
                            </span>
                            <Badge status={new Date(a.dueDate).getTime() - Date.now() < 86400000 * 2 ? 'late' : 'open'}>
                              {fmtDay(a.dueDate)}
                            </Badge>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ))}
            </div>
          )}
          {notes.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--cf-line)]">
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)] mb-1.5">Needs a glance</p>
              <ul className="space-y-1.5">
                {notes.slice(0, 3).map((n) => (
                  <li key={n._id} className="text-xs">
                    <p className="font-medium truncate">{n.title}</p>
                    <p className="text-[var(--cf-ink-mute)] line-clamp-1">{n.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.section>
      </div>

      {/* REGION 4 — actionable task cards */}
      <motion.div variants={staggerChild} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <Link to="/study" className={`${TASK} block`}>
          <p className="font-display text-sm font-bold flex items-center gap-2">
            <GraduationCap size={16} className="text-[#8B5CF6]" aria-hidden /> Study preview
          </p>
          <p className="mt-1 text-xs text-[var(--cf-ink-mute)]">
            {weakest.length ? `Start with ${weakest[0].subject} — lowest at ${Math.round(weakest[0].percentage ?? 0)}%.` : 'Revise anything, any time.'}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#2563FF]">Open study <ArrowRight size={13} aria-hidden /></span>
        </Link>
        <Link to="/placement" className={`${TASK} block`}>
          <p className="font-display text-sm font-bold flex items-center gap-2">
            <Briefcase size={16} className="text-[#8B5CF6]" aria-hidden /> Placement strip
          </p>
          {applications.length === 0 ? (
            <p className="mt-1 text-xs text-[var(--cf-ink-mute)]">No applications yet — browse open drives.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {applications.slice(0, 3).map((a) => (
                <Badge key={a._id} status={a.stage || 'applied'}>{a.drive?.role || 'Drive'}</Badge>
              ))}
              {applications.length > 3 && <span className="text-[11px] text-[var(--cf-ink-mute)]">+{applications.length - 3} more</span>}
            </div>
          )}
        </Link>
        <div className={TASK}>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--cf-ink-mute)]">Assignments</p>
          <p className="text-3xl font-bold tabular-nums"><AnimatedCounter value={assignments.length} /></p>
          <p className="text-[11px] text-[var(--cf-ink-mute)]">{overdue.length ? `${overdue.length} overdue` : 'all on track'}</p>
        </div>
        <div className={TASK}>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--cf-ink-mute)]">Applications</p>
          <p className="text-3xl font-bold tabular-nums"><AnimatedCounter value={applications.length} /></p>
          <p className="text-[11px] text-[var(--cf-ink-mute)]">in the pipeline</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
