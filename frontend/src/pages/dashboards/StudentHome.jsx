// StudentHome: personal command center — greeting+next-due, overdue banner,
// due list, placement pulse, attendance ring/health, stats, study CTA.
// Endpoints preserved: GET /assignments, /attendance/student/:id,
// /job-applications, /notifications. Real data only.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight, Briefcase, CalendarCheck, ClipboardList, GraduationCap } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui/primitives';
import { AnimatedCounter } from '../../components/ui/editorial';
import { AttendanceRing, Sparkline } from '../../components/data/views';
import { staggerChild, staggerParent } from '../../system/motion';

const fmtDay = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';
const dueIn = (d) => {
  const ms = new Date(d).getTime() - Date.now();
  if (ms <= 0) return 'due now';
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `in ${h}h`;
  const days = Math.floor(h / 24);
  return days === 1 ? 'in 1 day' : `in ${days} days`;
};

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
    let live = true;
    load().catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return assignments
      .filter((x) => x.dueDate && new Date(x.dueDate).getTime() >= now && !['graded', 'archived'].includes(x.status))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 4);
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return <LoadingState label="Assembling your day…" />;
  if (failed) return <ErrorState message="Couldn't load your dashboard." onRetry={load} />;

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      {/* 1 — greeting + next-due */}
      <motion.div variants={staggerChild} className="mb-5">
        <span className="brutal-tag inline-block bg-volt px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest">★ Student command</span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">{greeting}, <em className="cf-display font-normal">{user?.name?.split(' ')[0]}.</em></h1>
        <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
          {upcoming.length ? `Next up: ${upcoming[0].title} — due ${fmtDay(upcoming[0].dueDate)}.` : 'Nothing due right now. A rare, beautiful thing.'}
        </p>
      </motion.div>

      {/* 2 — overdue banner */}
      {overdue.length > 0 && (
        <motion.div variants={staggerChild} className="mb-4">
          <div className="racing-stripe h-2 border-2 border-[var(--cf-ink)] border-b-0" aria-hidden />
          <Link to="/assignments" className="card-brutal flex items-center gap-2 bg-flag px-4 py-3 text-sm font-semibold text-white">
            <AlertTriangle size={16} aria-hidden /> {overdue.length} overdue assignment{overdue.length > 1 ? 's need' : ' needs'} your attention <ArrowRight size={15} className="ml-auto" aria-hidden />
          </Link>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div variants={staggerChild} className="lg:col-span-2 space-y-4">
          {/* 3 — due list */}
          <Card className="role-card-animated">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold flex items-center gap-2"><ClipboardList size={17} className="text-primary-500" aria-hidden /> Due next</h2>
              <Link to="/assignments" className="text-xs font-medium text-primary-600 dark:text-primary-300 hover:underline">All assignments</Link>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState title="Clear skies" hint="Check the placement board?" />
            ) : (
              <ul className="divide-y divide-[var(--cf-line)]">
                {upcoming.map((a) => (
                  <li key={a._id}>
                    <Link to="/assignments" className="flex items-center gap-3 py-2.5 group">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium truncate group-hover:text-primary-600 dark:group-hover:text-primary-300 transition">{a.title}</span>
                        <span className="block text-xs text-[var(--cf-ink-mute)]">{a.subject?.name || ''} · {a.maxScore} pts · <span className="tabular-nums">{dueIn(a.dueDate)}</span></span>
                      </span>
                      <Badge status={new Date(a.dueDate).getTime() - Date.now() < 86400000 * 2 ? 'pending' : 'open'}>{fmtDay(a.dueDate)}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 4 — placement pulse */}
          <Card className="role-card-animated">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold flex items-center gap-2"><Briefcase size={17} className="text-accent-violet" aria-hidden /> Placement pulse</h2>
              <Link to="/placement" className="text-xs font-medium text-primary-600 dark:text-primary-300 hover:underline">Open board</Link>
            </div>
            {applications.length === 0 ? (
              <p className="text-sm text-[var(--cf-ink-mute)] py-2">No applications yet — <Link to="/placement" className="text-primary-600 dark:text-primary-300 hover:underline">browse open drives</Link>.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {applications.slice(0, 6).map((a) => (
                  <Badge key={a._id} status={a.stage || 'applied'}>{a.drive?.role || 'Drive'} · {(a.stage || 'applied').replace(/_/g, ' ')}</Badge>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={staggerChild} className="space-y-4">
          {/* 5 — attendance ring / health */}
          <Card className="role-card-animated">
            <h2 className="font-display text-base font-semibold flex items-center gap-2 mb-3"><CalendarCheck size={17} className="text-green-600" aria-hidden /> Academic pulse</h2>
            {health == null ? (
              <p className="text-sm text-[var(--cf-ink-mute)]">No attendance recorded yet.</p>
            ) : (
              <>
                <AttendanceRing value={health} />
                {trend.length > 1 && (
                  <div className="mt-3">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--cf-ink-mute)] mb-1">By subject</p>
                    <Sparkline points={trend} />
                  </div>
                )}
                {weakest.length > 0 && (
                  <div className="mt-3">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--cf-ink-mute)] mb-1.5">Watch list</p>
                    <ul className="space-y-1.5">
                      {weakest.map((w) => (
                        <li key={w.subjectId} className="flex items-center justify-between text-xs">
                          <Link to="/study" className="font-medium truncate hover:text-primary-600 dark:hover:text-primary-300 transition">{w.subject}</Link>
                          <span className="text-[var(--cf-ink-mute)] tabular-nums">{Math.round(w.percentage ?? 0)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            {/* 6 — stats */}
            <div className="grid grid-cols-2 gap-3 mt-4 border-t-2 border-[var(--cf-ink)] pt-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--cf-ink-mute)]">Assignments</p>
                <p className="text-2xl font-bold tabular-nums"><AnimatedCounter value={assignments.length} /></p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--cf-ink-mute)]">Applications</p>
                <p className="text-2xl font-bold tabular-nums"><AnimatedCounter value={applications.length} /></p>
              </div>
            </div>
          </Card>

          {/* 7 — study CTA */}
          <div className="card-brutal role-card-animated bg-gold p-4">
            <p className="font-display text-sm font-bold flex items-center gap-2"><GraduationCap size={16} aria-hidden /> Study room</p>
            <p className="mt-1 text-xs font-medium">
              {weakest.length ? `Start with ${weakest[0].subject} — your lowest attendance.` : 'Revise anything, any time.'}
            </p>
            <Link to="/study" className="btn-brutal mt-3 inline-flex items-center gap-1.5 rounded-[10px] bg-frame px-4 py-2 font-display text-xs font-bold text-white">
              Open study <ArrowRight size={13} aria-hidden />
            </Link>
          </div>

          {notes.length > 0 && (
            <Card>
              <h2 className="font-semibold text-sm mb-2">Needs a glance</h2>
              <ul className="space-y-2">
                {notes.map((n) => (
                  <li key={n._id} className="text-xs">
                    <p className="font-medium truncate">{n.title}</p>
                    <p className="text-[var(--cf-ink-mute)] line-clamp-2">{n.message}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
