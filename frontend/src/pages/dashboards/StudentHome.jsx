// StudentHome: energetic/progress — pulse + trajectory + assignments +
// study + placement strip. Regions on campus shells (Obsidian Ember palette).
// Endpoints preserved: GET /assignments, /attendance/student/:id,
// /job-applications, /notifications. Real data only.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, ArrowRight, Briefcase, ClipboardList, GraduationCap } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/primitives';
import { AttendanceRing, Sparkline } from '../../components/data/views';
import { AnalyticsPanel, LazyChart, RoleHero, SpotTask, TaskGrid, TaskStat, ActivityStream } from '../../components/campus/regions';
import { AttendanceTrend } from '../../components/campus/analytics';
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
  const reduced = useReducedMotion();
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
  if (failed) return <ErrorState message="Could not load your dashboard." onRetry={load} />;

  return (
    <motion.div {...(reduced ? {} : staggerParent(0.06))} initial={reduced ? false : 'initial'} animate="animate">
      {/* REGION 1 — Hero Pulse */}
      <motion.div variants={reduced ? undefined : staggerChild}>
        <RoleHero
          accent="student"
          title="Your day, in one glance."
          metric={health == null ? '—' : `${health}%`}
          sub={
            health == null
              ? `${greeting}, ${user?.name?.split(' ')[0]}. No attendance recorded yet.`
              : upcoming.length
                ? `${greeting}, ${user?.name?.split(' ')[0]}. Next up: ${upcoming[0].title} — due ${fmtDay(upcoming[0].dueDate)}.`
                : `${greeting}, ${user?.name?.split(' ')[0]}. Nothing due right now. A rare, beautiful thing.`
          }
          alert={overdue.length > 0 && (
            <Link to="/assignments" className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: '#FF5964' }}>
              <AlertTriangle size={13} aria-hidden /> {overdue.length} overdue — act now <ArrowRight size={13} aria-hidden />
            </Link>
          )}
          gauge={health != null && (
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
        />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        {/* REGION 2 — analytics: when is the crunch? */}
        <motion.div variants={reduced ? undefined : staggerChild} className="lg:col-span-2">
          <AnalyticsPanel
            title="Workload trajectory"
            icon={<ClipboardList size={17} className="text-[#D86D3E]" aria-hidden />}
            question="When is your crunch?"
            period="Due per day · next 7 days"
            tooltip="Counts live assignments by real due date. Peak load flags the day to start early."
            summary={peakLoad ? `Peak ${peakLoad} due in a single day — front-load that morning.` : 'Clear week ahead — bank the time into revision.'}
            empty={workload.every((w) => w.due === 0) ? 'Clear skies' : null}
            emptyHint="Check the placement board?"
            action={<Link to="/assignments" className="text-xs font-medium text-[#D86D3E] hover:underline">All assignments</Link>}
          >
            <LazyChart data={workload} xKey="day" series={[{ key: 'due', color: '#D86D3E' }]} height={200} />
          </AnalyticsPanel>
        </motion.div>

        {/* REGION 3 — activity stream: due timeline */}
        <motion.section variants={reduced ? undefined : staggerChild} className="bg-[var(--cf-surface)] rounded-[24px] border border-[var(--cf-line)] p-5" aria-label="Due timeline">
          <h2 className="font-display text-base font-semibold mb-3">Due timeline</h2>
          {upcoming.length === 0 ? (
            <EmptyState title="Clear skies" hint="Check the placement board?" />
          ) : (
            <div className="space-y-4">
              {Object.entries(buckets).map(([label, items]) => (
                items.length > 0 && (
                  <div key={label}>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)] mb-1.5">{label}</p>
                    <ActivityStream
                      label={`${label} assignments`}
                      items={items}
                      renderItem={(a) => (
                        <Link to="/assignments" className="flex items-center gap-2 group py-1">
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium truncate group-hover:text-[#D86D3E] transition">{a.title}</span>
                            <span className="block text-xs text-[var(--cf-ink-mute)] tabular-nums">{dueIn(a.dueDate)}</span>
                          </span>
                          <Badge status={new Date(a.dueDate).getTime() - Date.now() < 86400000 * 2 ? 'late' : 'open'}>
                            {fmtDay(a.dueDate)}
                          </Badge>
                        </Link>
                      )}
                    />
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

      {/* REGION 4 — task cards */}
      <motion.div variants={reduced ? undefined : staggerChild}>
        <TaskGrid>
          <SpotTask to="/study" label="Open study">
            <p className="font-display text-sm font-bold flex items-center gap-2">
              <GraduationCap size={16} className="text-[#A77B68]" aria-hidden /> Study preview
            </p>
            <p className="mt-1 text-xs text-[var(--cf-ink-mute)]">
              {weakest.length ? `Start with ${weakest[0].subject} — lowest at ${Math.round(weakest[0].percentage ?? 0)}%.` : 'Revise anything, any time.'}
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#D86D3E]">Open study <ArrowRight size={13} aria-hidden /></span>
          </SpotTask>
          <SpotTask to="/placement" label="Open placement board">
            <p className="font-display text-sm font-bold flex items-center gap-2">
              <Briefcase size={16} className="text-[#A77B68]" aria-hidden /> Placement strip
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
          </SpotTask>
          <SpotTask to="/assignments" label="Open assignments">
            <TaskStat label="Assignments" value={assignments.length} sub={overdue.length ? `${overdue.length} overdue` : 'all on track'} />
          </SpotTask>
          <SpotTask to="/placement" label="Open applications">
            <TaskStat label="Applications" value={applications.length} sub="in the pipeline" />
          </SpotTask>
        </TaskGrid>
      </motion.div>
      <motion.div variants={reduced ? undefined : staggerChild} className="mt-4">
        <AttendanceTrend />
      </motion.div>
    </motion.div>
  );
}
