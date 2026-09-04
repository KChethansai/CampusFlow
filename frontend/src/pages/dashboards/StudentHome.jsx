// StudentHome: personal command center — Today, pulses, actions. No metric-card grid.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight, Briefcase, CalendarCheck, ClipboardList } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, Card, LoadingState, Stat } from '../../components/ui/primitives';
import { AttendanceRing, Sparkline } from '../../components/data/views';
import { staggerChild, staggerParent } from '../../system/motion';

const fmtDay = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';

export default function StudentHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    let live = true;
    (async () => {
      const [a, s, j, n] = await Promise.allSettled([
        api.get('/assignments'),
        user?._id ? api.get(`/attendance/student/${user._id}`) : Promise.reject(new Error('no-id')),
        api.get('/job-applications'),
        api.get('/notifications')
      ]);
      if (!live) return;
      if (a.status === 'fulfilled') setAssignments(a.value.data.data || []);
      if (s.status === 'fulfilled') {
        const d = s.value.data.data;
        setAttendance(Array.isArray(d) ? d : d?.sessions || d?.records || []);
      }
      if (j.status === 'fulfilled') setApplications(j.value.data.data || []);
      if (n.status === 'fulfilled') setNotes((n.value.data.data || []).filter((x) => !x.isRead).slice(0, 4));
      setLoading(false);
    })();
    return () => { live = false; };
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

  const health = useMemo(() => {
    const recs = attendance.flatMap((s) => s.records || (Array.isArray(s) ? [s] : []));
    if (!recs.length) return null;
    const present = recs.filter((r) => r.status === 'present' || r.status === 'late').length;
    return Math.round((present / recs.length) * 100);
  }, [attendance]);

  const trend = useMemo(() => {
    // Per-session present-rate trend (last 8 sessions).
    return attendance.slice(-8).map((s) => {
      const recs = s.records || [];
      if (!recs.length) return 0;
      return Math.round((recs.filter((r) => r.status === 'present').length / recs.length) * 100);
    });
  }, [attendance]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return <LoadingState label="Assembling your day…" />;

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      <motion.div variants={staggerChild} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{greeting}, {user?.name?.split(' ')[0]}.</h1>
        <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
          {upcoming.length ? `Next up: ${upcoming[0].title} — due ${fmtDay(upcoming[0].dueDate)}.` : 'Nothing due right now. A rare, beautiful thing.'}
        </p>
      </motion.div>

      {overdue.length > 0 && (
        <motion.div variants={staggerChild}>
          <Link to="/assignments" className="mb-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-800 dark:text-red-200">
            <AlertTriangle size={16} /> {overdue.length} overdue assignment{overdue.length > 1 ? 's need' : ' needs'} your attention <ArrowRight size={15} className="ml-auto" />
          </Link>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div variants={staggerChild} className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2"><ClipboardList size={17} className="text-primary-500" /> Due next</h2>
              <Link to="/assignments" className="text-xs font-medium text-primary-600 hover:underline">All assignments</Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-[var(--cf-ink-mute)] py-4 text-center">Clear skies. Check the placement board?</p>
            ) : (
              <ul className="divide-y divide-[var(--cf-line)]">
                {upcoming.map((a) => (
                  <li key={a._id}>
                    <Link to="/assignments" className="flex items-center gap-3 py-2.5 group">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium truncate group-hover:text-primary-600 transition">{a.title}</span>
                        <span className="block text-xs text-[var(--cf-ink-mute)]">{a.subject?.name || ''} · {a.maxScore} pts</span>
                      </span>
                      <Badge status={new Date(a.dueDate).getTime() - Date.now() < 86400000 * 2 ? 'pending' : 'open'}>{fmtDay(a.dueDate)}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2"><Briefcase size={17} className="text-accent-violet" /> Placement pulse</h2>
              <Link to="/placement" className="text-xs font-medium text-primary-600 hover:underline">Open board</Link>
            </div>
            {applications.length === 0 ? (
              <p className="text-sm text-[var(--cf-ink-mute)] py-2">No applications yet — <Link to="/placement" className="text-primary-600 hover:underline">browse open drives</Link>.</p>
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
          <Card>
            <h2 className="font-semibold flex items-center gap-2 mb-3"><CalendarCheck size={17} className="text-green-600" /> Academic pulse</h2>
            {health == null ? (
              <p className="text-sm text-[var(--cf-ink-mute)]">No attendance recorded yet.</p>
            ) : (
              <>
                <AttendanceRing value={health} />
                {trend.length > 1 && (
                  <div className="mt-3">
                    <p className="text-[11px] uppercase tracking-wide text-[var(--cf-ink-mute)] mb-1">Recent trend</p>
                    <Sparkline points={trend} />
                  </div>
                )}
              </>
            )}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Stat label="Assignments" value={assignments.length} />
              <Stat label="Applications" value={applications.length} />
            </div>
          </Card>

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
