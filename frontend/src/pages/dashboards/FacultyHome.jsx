// FacultyHome: today's classes, grading queue, subjects, requests.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookMarked, CalendarCheck, ClipboardList, Inbox, Megaphone } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, Card, LoadingState, Stat } from '../../components/ui/primitives';
import { staggerChild, staggerParent } from '../../system/motion';

export default function FacultyHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    let live = true;
    (async () => {
      const [su, a, sm, r, at] = await Promise.allSettled([
        api.get('/subjects'), api.get('/assignments'), api.get('/submissions'),
        api.get('/requests'), api.get('/attendance')
      ]);
      if (!live) return;
      if (su.status === 'fulfilled') setSubjects(su.value.data.data || []);
      if (a.status === 'fulfilled') setAssignments(a.value.data.data || []);
      if (sm.status === 'fulfilled') setSubmissions(sm.value.data.data || []);
      if (r.status === 'fulfilled') setRequests(r.value.data.data || []);
      if (at.status === 'fulfilled') setSessions(at.value.data.data || []);
      setLoading(false);
    })();
    return () => { live = false; };
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

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      <motion.div variants={staggerChild} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Namaste, <em className="cf-display font-normal">{user?.name?.split(' ')[0]}.</em></h1>
        <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
          {todaySessions.length ? `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} on record today.` : 'No sessions recorded today yet.'}
          {gradeQueue.length ? ` ${gradeQueue.length} submission${gradeQueue.length > 1 ? 's' : ''} waiting for review.` : ''}
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { to: '/attendance', Icon: CalendarCheck, label: 'Take attendance', hint: 'Mark today’s classes' },
          { to: '/assignments', Icon: ClipboardList, label: 'Create assignment', hint: 'Publish in minutes' },
          { to: '/assignments', Icon: BookMarked, label: 'Review submissions', hint: `${gradeQueue.length} pending` },
          { to: '/requests', Icon: Megaphone, label: 'Requests', hint: `${pendingRequests.length} awaiting you` }
        ].map(({ to, Icon, label, hint }) => (
          <motion.div key={label} variants={staggerChild}>
            <Link to={to} className="block p-4 rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-line)] shadow-1 hover:shadow-3 hover:-translate-y-0.5 transition-all">
              <Icon size={19} className="text-primary-500" />
              <p className="mt-2 text-sm font-semibold">{label}</p>
              <p className="text-xs text-[var(--cf-ink-mute)]">{hint}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div variants={staggerChild} className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Grading queue</h2>
              <Link to="/assignments" className="text-xs font-medium text-primary-600 hover:underline">Open assignments</Link>
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
          <Card>
            <h2 className="font-semibold text-sm mb-3">My subjects</h2>
            <div className="flex flex-wrap gap-1.5">
              {subjects.slice(0, 8).map((s) => (
                <Badge key={s._id} tone="bg-black/[.05] dark:bg-white/10 text-[var(--cf-ink-soft)]">{s.name}</Badge>
              ))}
              {subjects.length === 0 && <p className="text-xs text-[var(--cf-ink-mute)]">No subjects assigned.</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Stat label="Assignments" value={myAssignments.length} />
              <Stat label="Pending requests" value={pendingRequests.length} />
            </div>
          </Card>
          {pendingRequests.length > 0 && (
            <Card>
              <h2 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Inbox size={15} /> Requests awaiting you</h2>
              <ul className="space-y-2">
                {pendingRequests.slice(0, 4).map((r) => (
                  <li key={r._id}>
                    <Link to="/requests" className="block text-xs hover:text-primary-600 transition">
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
