// FacultyHome: hierarchical regions — R1 Teaching pulse hero (macro workload +
// grading gauge), R2 grading queue (primary surface), R3 subjects + requests
// stream, R4 actionable task cards.
// Endpoints preserved: GET /subjects, /assignments, /submissions,
// /requests, /attendance. Real data only.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { BookMarked, CalendarCheck, ClipboardList, Inbox } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/primitives';
import { AnimatedCounter } from '../../components/ui/editorial';
import { AttendanceRing } from '../../components/data/views';
import { staggerChild, staggerParent } from '../../system/motion';

const HERO = 'cf-glass rounded-[24px] border border-[var(--cf-line)] p-6 sm:p-8 relative overflow-hidden';
const PANEL = 'cf-glass rounded-[24px] border border-[var(--cf-line)] p-5';
const TASK = 'rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface)] p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg block';

const ACTIONS = [
  { to: '/attendance', Icon: CalendarCheck, label: 'Take attendance', hint: 'Mark today’s classes' },
  { to: '/assignments', Icon: ClipboardList, label: 'Create assignment', hint: 'Publish in minutes' },
  { to: '/assignments', Icon: BookMarked, label: 'Review submissions', hintKey: 'gradeQueue' },
  { to: '/requests', Icon: Inbox, label: 'Requests', hintKey: 'pendingRequests' }
];

export default function FacultyHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    const [su, a, sm, r, at] = await Promise.allSettled([
      api.get('/subjects'), api.get('/assignments'), api.get('/submissions'),
      api.get('/requests'), api.get('/attendance')
    ]);
    let ok = false;
    if (su.status === 'fulfilled') { setSubjects(su.value.data.data || []); ok = true; }
    if (a.status === 'fulfilled') { setAssignments(a.value.data.data || []); ok = true; }
    if (sm.status === 'fulfilled') { setSubmissions(sm.value.data.data || []); ok = true; }
    if (r.status === 'fulfilled') { setRequests(r.value.data.data || []); ok = true; }
    if (at.status === 'fulfilled') { setSessions(at.value.data.data || []); ok = true; }
    if (!ok) setFailed(true);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myAssignments = useMemo(
    () => assignments.filter((a) => !a.createdBy || String(a.createdBy?._id || a.createdBy) === String(user?._id)),
    [assignments, user?._id]
  );
  const gradeQueue = useMemo(
    () => submissions.filter((s) => !['graded'].includes(s.status)),
    [submissions]
  );
  // Grading completion drives the hero gauge — real statuses only.
  const gradedPct = useMemo(() => {
    if (!submissions.length) return null;
    const done = submissions.filter((s) => s.status === 'graded').length;
    return Math.round((done / submissions.length) * 100);
  }, [submissions]);
  const pendingRequests = useMemo(
    () => requests.filter((r) => ['pending', 'in_review'].includes(r.status)),
    [requests]
  );
  const todaySessions = useMemo(() => {
    const today = new Date().toDateString();
    return sessions.filter((s) => s.date && new Date(s.date).toDateString() === today);
  }, [sessions]);

  if (loading) return <LoadingState label="Preparing your classes…" />;
  if (failed) return <ErrorState message="Couldn't load your dashboard." onRetry={load} />;

  const hintFor = (key) =>
    key === 'gradeQueue' ? `${gradeQueue.length} pending`
    : key === 'pendingRequests' ? `${pendingRequests.length} awaiting you`
    : '';

  const pulse = gradeQueue.length + pendingRequests.length;

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      {/* REGION 1 — Teaching pulse hero */}
      <motion.section variants={staggerChild} className={HERO} aria-label="Teaching pulse">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1 basis-64">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A7D700]" aria-hidden />
              Teaching Pulse
            </p>
            <h1 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight">
              Namaste, <em className="cf-display font-normal">{user?.name?.split(' ')[0]}.</em>
            </h1>
            <p className="mt-2 text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
              <AnimatedCounter value={pulse} />
            </p>
            <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
              items need you · {todaySessions.length ? `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} on record today` : 'no sessions recorded today yet'}
              {gradeQueue.length ? ` · ${gradeQueue.length} awaiting review` : ' · grading clear'}.
            </p>
          </div>
          {gradedPct != null && (
            <AttendanceRing value={gradedPct} label="Grading completion" />
          )}
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        {/* REGION 2 — grading queue, primary surface (~65%) */}
        <motion.section variants={staggerChild} className={`${PANEL} lg:col-span-2`} aria-label="Grading queue">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold">
              Grading queue{' '}
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white tabular-nums" style={{ background: gradeQueue.length ? '#FF5964' : '#25D890' }}>
                {gradeQueue.length}
              </span>
            </h2>
            <Link to="/assignments" className="text-xs font-medium text-[#2563FF] hover:underline">Open assignments</Link>
          </div>
          {gradeQueue.length === 0 ? (
            <EmptyState title="Inbox zero" hint="Enjoy it while it lasts." />
          ) : (
            <ul className="divide-y divide-[var(--cf-line)]">
              {gradeQueue.slice(0, 6).map((s) => (
                <li key={s._id} className="py-2.5 flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{s.assignment?.title || 'Submission'}</span>
                    <span className="block text-xs text-[var(--cf-ink-mute)]">{s.student?.name || 'Student'}</span>
                  </span>
                  <Badge status={s.status || 'submitted'}>{(s.status || 'submitted').replace(/_/g, ' ')}</Badge>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        {/* REGION 3 — subjects + requests stream (~35%) */}
        <motion.section variants={staggerChild} className={`${PANEL} space-y-4`} aria-label="Subjects and requests">
          <div>
            <h2 className="font-display text-base font-semibold mb-2">My subjects</h2>
            <div className="flex flex-wrap gap-1.5">
              {subjects.slice(0, 8).map((s) => (
                <Badge key={s._id} tone="bg-black/[.05] dark:bg-white/10 text-[var(--cf-ink-soft)]">{s.name}</Badge>
              ))}
              {subjects.length === 0 && <p className="text-xs text-[var(--cf-ink-mute)]">No subjects assigned.</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[var(--cf-line)]">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--cf-ink-mute)]">Assignments</p>
                <p className="text-2xl font-bold tabular-nums"><AnimatedCounter value={myAssignments.length} /></p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--cf-ink-mute)]">Pending requests</p>
                <p className="text-2xl font-bold tabular-nums"><AnimatedCounter value={pendingRequests.length} /></p>
              </div>
            </div>
          </div>
          {pendingRequests.length > 0 && (
            <div className="pt-3 border-t border-[var(--cf-line)]">
              <h2 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Inbox size={15} aria-hidden /> Requests awaiting you</h2>
              <ul className="space-y-2">
                {pendingRequests.slice(0, 4).map((r) => (
                  <li key={r._id}>
                    <Link to="/requests" className="block text-xs hover:text-[#2563FF] transition">
                      <span className="font-medium">{r.title}</span>
                      <span className="text-[var(--cf-ink-mute)]"> · {r.student?.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.section>
      </div>

      {/* REGION 4 — actionable task cards */}
      <motion.div variants={staggerChild} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {ACTIONS.map(({ to, Icon, label, hint, hintKey }) => (
          <Link key={label} to={to} className={TASK}>
            <span className="inline-grid place-items-center w-9 h-9 rounded-[14px] bg-[#2563FF]/10 text-[#2563FF]" aria-hidden>
              <Icon size={18} />
            </span>
            <p className="mt-3 text-sm font-bold font-display">{label}</p>
            <p className="text-xs text-[var(--cf-ink-mute)]">{hint || hintFor(hintKey)}</p>
          </Link>
        ))}
      </motion.div>
    </motion.div>
  );
}
