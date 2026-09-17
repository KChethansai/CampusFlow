// FacultyHome: 4 action cards → grading queue (real ungraded submissions) →
// subjects → requests awaiting → stats.
// Endpoints preserved: GET /subjects, /assignments, /submissions,
// /requests, /attendance. Real data only.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { BookMarked, CalendarCheck, ClipboardList, Inbox } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, Card, ErrorState, LoadingState } from '../../components/ui/primitives';
import { AnimatedCounter } from '../../components/ui/editorial';
import { staggerChild, staggerParent } from '../../system/motion';

const ACTIONS = [
  { to: '/attendance', Icon: CalendarCheck, label: 'Take attendance', hint: 'Mark today’s classes', tag: 'bg-volt' },
  { to: '/assignments', Icon: ClipboardList, label: 'Create assignment', hint: 'Publish in minutes', tag: 'bg-gold' },
  { to: '/assignments', Icon: BookMarked, label: 'Review submissions', hintKey: 'gradeQueue', tag: 'bg-accent-cyan' },
  { to: '/requests', Icon: Inbox, label: 'Requests', hintKey: 'pendingRequests', tag: 'bg-accent-violet' }
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
    () => assignments.filter((a) => !a.createdBy || String(a.createdBy?._id || a.createdBy) === String(user?._id)).slice(0, 5),
    [assignments, user?._id]
  );
  const gradeQueue = useMemo(
    () => submissions.filter((s) => !['graded'].includes(s.status)).slice(0, 6),
    [submissions]
  );
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

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      <motion.div variants={staggerChild} className="mb-5">
        <span className="brutal-tag inline-block bg-volt px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest">★ Faculty desk</span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">Namaste, <em className="cf-display font-normal">{user?.name?.split(' ')[0]}.</em></h1>
        <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
          {todaySessions.length ? `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} on record today.` : 'No sessions recorded today yet.'}
          {gradeQueue.length ? ` ${gradeQueue.length} submission${gradeQueue.length > 1 ? 's' : ''} waiting for review.` : ''}
        </p>
      </motion.div>

      {/* 4 action cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {ACTIONS.map(({ to, Icon, label, hint, hintKey, tag }) => (
          <motion.div key={label} variants={staggerChild}>
            <Link to={to} className="card-brutal role-card-animated block p-4">
              <span className={`brutal-tag inline-grid place-items-center w-9 h-9 ${tag}`} aria-hidden>
                <Icon size={18} className="text-coal" />
              </span>
              <p className="mt-3 text-sm font-bold font-display">{label}</p>
              <p className="text-xs text-[var(--cf-ink-mute)]">{hint || hintFor(hintKey)}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* grading queue — real ungraded submissions */}
        <motion.div variants={staggerChild} className="lg:col-span-2">
          <Card className="role-card-animated">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold">Grading queue <span className="brutal-tag bg-flag text-white ml-1 px-2 py-0.5 text-[11px]">{gradeQueue.length}</span></h2>
              <Link to="/assignments" className="text-xs font-medium text-primary-600 dark:text-primary-300 hover:underline">Open assignments</Link>
            </div>
            {gradeQueue.length === 0 ? (
              <p className="text-sm text-[var(--cf-ink-mute)] py-4 text-center">Inbox zero. Enjoy it while it lasts.</p>
            ) : (
              <ul className="divide-y divide-[var(--cf-line)]">
                {gradeQueue.map((s) => (
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
          </Card>
        </motion.div>
        <motion.div variants={staggerChild} className="space-y-4">
          {/* subjects */}
          <Card className="role-card-animated">
            <h2 className="font-display text-base font-semibold mb-3">My subjects</h2>
            <div className="flex flex-wrap gap-1.5">
              {subjects.slice(0, 8).map((s) => (
                <Badge key={s._id} tone="bg-black/[.05] dark:bg-white/10 text-[var(--cf-ink-soft)]">{s.name}</Badge>
              ))}
              {subjects.length === 0 && <p className="text-xs text-[var(--cf-ink-mute)]">No subjects assigned.</p>}
            </div>
            {/* stats */}
            <div className="grid grid-cols-2 gap-3 mt-4 border-t-2 border-[var(--cf-ink)] pt-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--cf-ink-mute)]">Assignments</p>
                <p className="text-2xl font-bold tabular-nums"><AnimatedCounter value={myAssignments.length} /></p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--cf-ink-mute)]">Pending requests</p>
                <p className="text-2xl font-bold tabular-nums"><AnimatedCounter value={pendingRequests.length} /></p>
              </div>
            </div>
          </Card>
          {/* requests awaiting */}
          {pendingRequests.length > 0 && (
            <Card>
              <h2 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Inbox size={15} aria-hidden /> Requests awaiting you</h2>
              <ul className="space-y-2">
                {pendingRequests.slice(0, 4).map((r) => (
                  <li key={r._id}>
                    <Link to="/requests" className="block text-xs hover:text-primary-600 dark:hover:text-primary-300 transition">
                      <span className="font-medium">{r.title}</span>
                      <span className="text-[var(--cf-ink-mute)]"> · {r.student?.name}</span>
                    </Link>
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
