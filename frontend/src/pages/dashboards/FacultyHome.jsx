// FacultyHome: productivity — teaching pulse + grading queue + subjects +
// requests. Regions on campus shells (faculty blue+cyan).
// Endpoints preserved: GET /subjects, /assignments, /submissions,
// /requests, /attendance. Real data only.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { BookMarked, CalendarCheck, ClipboardList, Inbox } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/primitives';
import { AttendanceRing } from '../../components/data/views';
import { AnimatedCounter } from '../../components/ui/editorial';
import { AnalyticsPanel, LazyChart, RoleHero, SpotTask, TaskGrid, ActivityStream } from '../../components/campus/regions';
import { staggerChild, staggerParent } from '../../system/motion';

const ACTIONS = [
  { to: '/attendance', Icon: CalendarCheck, label: 'Take attendance', hint: 'Mark today’s classes' },
  { to: '/assignments', Icon: ClipboardList, label: 'Create assignment', hint: 'Publish in minutes' },
  { to: '/assignments', Icon: BookMarked, label: 'Review submissions', hintKey: 'gradeQueue' },
  { to: '/requests', Icon: Inbox, label: 'Requests', hintKey: 'pendingRequests' }
];

export default function FacultyHome() {
  const reduced = useReducedMotion();
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

  // Which assignment buries you? Pending reviews per assignment (real submissions).
  const loadRows = useMemo(() => {
    const m = {};
    gradeQueue.forEach((s) => {
      const id = String(s.assignment?._id || s.assignment || 'other');
      const title = s.assignment?.title || 'Ungrouped';
      (m[id] = m[id] || { assignment: title.slice(0, 18), pending: 0 }).pending++;
    });
    return Object.values(m).sort((a, b) => b.pending - a.pending).slice(0, 6);
  }, [gradeQueue]);

  if (loading) return <LoadingState label="Preparing your classes…" />;
  if (failed) return <ErrorState message="Could not load your dashboard." onRetry={load} />;

  const hintFor = (key) =>
    key === 'gradeQueue' ? `${gradeQueue.length} pending`
    : key === 'pendingRequests' ? `${pendingRequests.length} awaiting you`
    : '';

  const pulse = gradeQueue.length + pendingRequests.length;

  return (
    <motion.div {...(reduced ? {} : staggerParent(0.06))} initial={reduced ? false : 'initial'} animate="animate">
      {/* REGION 1 — Teaching pulse hero */}
      <motion.div variants={reduced ? undefined : staggerChild}>
        <RoleHero
          accent="faculty"
          title="Your teaching queue."
          metric={pulse}
          sub={`Welcome, ${user?.name?.split(' ')[0]}. ${pulse} items need you · ${todaySessions.length ? `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} on record today` : 'no sessions recorded today yet'}${gradeQueue.length ? ` · ${gradeQueue.length} awaiting review` : ' · grading clear'}.`}
          gauge={gradedPct != null && <AttendanceRing value={gradedPct} label="Grading completion" />}
        />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        {/* REGION 2 — analytics: which assignment buries you? */}
        <motion.div variants={reduced ? undefined : staggerChild} className="lg:col-span-2">
          <AnalyticsPanel
            title="Grading load"
            question="Which assignment buries you?"
            period="Pending reviews · right now"
            tooltip="Counts ungraded submissions per assignment from live submission statuses."
            summary={loadRows.length ? `“${loadRows[0].assignment}” holds ${loadRows[0].pending} of ${gradeQueue.length} pending reviews — clear it first.` : undefined}
            empty={loadRows.length === 0 ? 'Inbox zero' : null}
            emptyHint="Enjoy it while it lasts."
            action={<Link to="/assignments" className="text-xs font-medium text-[#D86D3E] hover:underline">Open assignments</Link>}
          >
            <LazyChart kind="bar" data={loadRows} xKey="assignment" series={[{ key: 'pending', color: '#C87D4B' }]} height={200} />
          </AnalyticsPanel>
        </motion.div>

        {/* REGION 3 — subjects + requests stream */}
        <motion.section variants={reduced ? undefined : staggerChild} className="bg-[var(--cf-surface)] rounded-[24px] border border-[var(--cf-line)] p-5 space-y-4" aria-label="Subjects and requests">
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
          <div>
            <h2 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Inbox size={15} aria-hidden /> Grading queue</h2>
            {gradeQueue.length === 0 ? (
              <EmptyState title="Inbox zero" hint="Enjoy it while it lasts." />
            ) : (
              <ActivityStream
                label="Submissions awaiting review"
                items={gradeQueue.slice(0, 6)}
                renderItem={(s) => (
                  <span className="py-2.5 flex items-center gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">{s.assignment?.title || 'Submission'}</span>
                      <span className="block text-xs text-[var(--cf-ink-mute)]">{s.student?.name || 'Student'}</span>
                    </span>
                    <Badge status={s.status || 'submitted'}>{(s.status || 'submitted').replace(/_/g, ' ')}</Badge>
                  </span>
                )}
              />
            )}
          </div>
          {pendingRequests.length > 0 && (
            <div className="pt-3 border-t border-[var(--cf-line)]">
              <h2 className="font-semibold text-sm mb-2">Requests awaiting you</h2>
              <ul className="space-y-2">
                {pendingRequests.slice(0, 4).map((r) => (
                  <li key={r._id}>
                    <Link to="/requests" className="block text-xs hover:text-[#D86D3E] transition">
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

      {/* REGION 4 — task cards */}
      <motion.div variants={reduced ? undefined : staggerChild}>
        <TaskGrid>
          {ACTIONS.map(({ to, Icon, label, hint, hintKey }) => (
            <SpotTask key={label} to={to} label={label}>
              <span className="inline-grid place-items-center w-9 h-9 rounded-[14px] bg-[#D86D3E]/10 text-[#D86D3E]" aria-hidden>
                <Icon size={18} />
              </span>
              <p className="mt-3 text-sm font-bold font-display">{label}</p>
              <p className="text-xs text-[var(--cf-ink-mute)]">{hint || hintFor(hintKey)}</p>
            </SpotTask>
          ))}
        </TaskGrid>
      </motion.div>
    </motion.div>
  );
}
