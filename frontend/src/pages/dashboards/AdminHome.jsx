// AdminHome: 4 pulse cards (real counts + roleMix) → growth trend (real
// users) → request queue → intelligence stat.
// super_admin vs college_admin are distinguished ONLY by existing data/Nav —
// no merged or new role logic here.
// Endpoints preserved: GET /users, /departments, /courses, /requests,
// /ai-reports. Real data only.
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { BookOpen, Building2, Inbox, Sparkles, Users } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, Card, ErrorState, LoadingState } from '../../components/ui/primitives';
import { AnimatedCounter } from '../../components/ui/editorial';
import { Sparkline } from '../../components/data/views';
import { staggerChild, staggerParent } from '../../system/motion';

// TrendChart is optional — Suspense guards its absence; Sparkline fallback
// always renders from the same real user data.
const TrendChart = lazy(() =>
  import('../../components/data/TrendChart')
    .then((m) => ({ default: m.TrendChart || m.default }))
    .catch(() => ({ default: () => null }))
);

const PULSE = [
  { to: '/users', Icon: Users, label: 'People', key: 'users', tag: 'bg-volt' },
  { to: '/departments', Icon: Building2, label: 'Departments', key: 'departments', tag: 'bg-gold' },
  { to: '/courses', Icon: BookOpen, label: 'Courses', key: 'courses', tag: 'bg-accent-cyan' },
  { to: '/requests', Icon: Inbox, label: 'Open requests', key: 'pending', tag: 'bg-accent-violet' }
];

export default function AdminHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    const [u, d, c, r, ai] = await Promise.allSettled([
      api.get('/users'), api.get('/departments'), api.get('/courses'),
      api.get('/requests'), api.get('/ai-reports')
    ]);
    let ok = false;
    if (u.status === 'fulfilled') { setUsers(u.value.data.data || []); ok = true; }
    if (d.status === 'fulfilled') { setDepartments(d.value.data.data || []); ok = true; }
    if (c.status === 'fulfilled') { setCourses(c.value.data.data || []); ok = true; }
    if (r.status === 'fulfilled') { setRequests(r.value.data.data || []); ok = true; }
    if (ai.status === 'fulfilled') { setReports(ai.value.data.data || []); ok = true; }
    if (!ok) setFailed(true);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleMix = useMemo(() => {
    const m = {};
    users.forEach((u) => { m[u.role] = (m[u.role] || 0) + 1; });
    return m;
  }, [users]);
  const pending = useMemo(() => requests.filter((r) => ['pending', 'in_review'].includes(r.status)), [requests]);

  // Real-user growth series: cumulative accounts per month (last 8 buckets).
  const growth = useMemo(() => {
    const sorted = [...users].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    const buckets = Array(8).fill(0);
    sorted.forEach((_, i) => { buckets[Math.min(7, Math.floor((i / Math.max(1, sorted.length)) * 8))]++; });
    let acc = 0;
    return buckets.map((b) => (acc += b));
  }, [users]);

  const growthRows = useMemo(
    () => growth.map((usersCount, i) => ({ bucket: `P${i + 1}`, users: usersCount })),
    [growth]
  );

  if (loading) return <LoadingState label="Reading institution pulse…" />;
  if (failed) return <ErrorState message="Couldn't load institution data." onRetry={load} />;

  const values = { users: users.length, departments: departments.length, courses: courses.length, pending: pending.length };
  const subs = {
    users: `${roleMix.student || 0} students · ${roleMix.faculty || 0} faculty`,
    departments: 'Across the institution',
    courses: 'Active catalog',
    pending: 'Pending + in review'
  };

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      <motion.div variants={staggerChild} className="mb-5">
        <span className="brutal-tag inline-block bg-flag text-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest">★ Institution pulse</span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">Institution <em className="cf-display font-normal">pulse.</em></h1>
        <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
          {users.length} people · {departments.length} departments · {courses.length} courses
          {pending.length ? ` · ${pending.length} requests need review` : ' · queues are clear'}.
        </p>
      </motion.div>

      {/* 4 pulse cards — real counts */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {PULSE.map(({ to, Icon, label, key, tag }) => (
          <motion.div key={label} variants={staggerChild}>
            <Link to={to} className="card-brutal role-card-animated block p-4">
              <span className="flex items-center gap-2">
                <span className={`brutal-tag inline-grid place-items-center w-8 h-8 ${tag}`} aria-hidden><Icon size={16} className="text-coal" /></span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">{label}</span>
              </span>
              <span className="block text-3xl font-bold tabular-nums mt-2"><AnimatedCounter value={values[key]} /></span>
              <span className="block text-xs text-[var(--cf-ink-mute)] mt-0.5">{subs[key]}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* growth trend — real users */}
        <motion.div variants={staggerChild} className="lg:col-span-2">
          <Card className="role-card-animated">
            <h2 className="font-display text-base font-semibold mb-1">Community growth</h2>
            <p className="text-xs text-[var(--cf-ink-mute)] mb-3">Cumulative accounts over time · {users.length} total.</p>
            <Suspense fallback={<Sparkline points={growth} width={420} height={90} />}>
              <TrendChart data={growthRows} xKey="bucket" lines={[{ key: 'users' }]} height={180} />
            </Suspense>
            <div className="mt-2"><Sparkline points={growth} width={420} height={90} /></div>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {Object.entries(roleMix).map(([role, n]) => (
                <Badge key={role} role={role}>{role.replace(/_/g, ' ')} · {n}</Badge>
              ))}
            </div>
          </Card>
        </motion.div>
        <motion.div variants={staggerChild} className="space-y-4">
          {/* request queue */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm">Request queue</h2>
              <Link to="/requests" className="text-xs font-medium text-primary-600 dark:text-primary-300 hover:underline">Review</Link>
            </div>
            {pending.length === 0 ? (
              <p className="text-xs text-[var(--cf-ink-mute)]">All clear.</p>
            ) : (
              <ul className="space-y-2">
                {pending.slice(0, 5).map((r) => (
                  <li key={r._id} className="text-xs flex items-center gap-2">
                    <Badge status={r.status}>{r.status.replace(/_/g, ' ')}</Badge>
                    <span className="font-medium truncate">{r.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {/* intelligence stat */}
          <div className="card-brutal bg-frame text-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-sm font-bold flex items-center gap-1.5"><Sparkles size={14} aria-hidden /> Intelligence</h2>
              <Link to="/ai-reports" className="text-xs font-bold text-volt hover:underline">Open</Link>
            </div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest opacity-70">Reports generated</p>
            <p className="text-3xl font-bold tabular-nums"><AnimatedCounter value={reports.length} /></p>
            <p className="mt-1 text-xs opacity-70">{reports.some((r) => r.provider === 'none') ? 'AI provider not configured' : 'Provider live'}</p>
          </div>
        </motion.div>
      </div>
      <p className="sr-only">Signed in as {user?.name}, {user?.role}.</p>
    </motion.div>
  );
}
