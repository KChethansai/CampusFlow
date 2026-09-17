// AdminHome: hierarchical regions — R1 Campus pulse hero (macro population +
// clearance gauge + role mix), R2 community growth Area chart, R3 request queue
// stream, R4 department health table w/ sparklines + intelligence task card.
// super_admin vs college_admin are distinguished ONLY by existing data/Nav —
// no merged or new role logic here.
// Endpoints preserved: GET /users, /departments, /courses, /requests,
// /ai-reports. Real data only.
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/primitives';
import { AnimatedCounter } from '../../components/ui/editorial';
import { AttendanceRing, Sparkline } from '../../components/data/views';
import { staggerChild, staggerParent } from '../../system/motion';

// TrendChart is optional — Suspense guards its absence; Sparkline fallback
// always renders from the same real user data.
const TrendChart = lazy(() =>
  import('../../components/data/TrendChart')
    .then((m) => ({ default: m.TrendChart || m.default }))
    .catch(() => ({ default: () => null }))
);

const HERO = 'cf-glass rounded-[24px] border border-[var(--cf-line)] p-6 sm:p-8 relative overflow-hidden';
const PANEL = 'cf-glass rounded-[24px] border border-[var(--cf-line)] p-5';
const TASK = 'rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface)] p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg';

const deptId = (v) => String(v?._id || v || '');

// Cumulative 8-bucket series from real createdAt timestamps.
const cumulative = (rows) => {
  const sorted = [...rows].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  const buckets = Array(8).fill(0);
  sorted.forEach((_, i) => { buckets[Math.min(7, Math.floor((i / Math.max(1, sorted.length)) * 8))]++; });
  let acc = 0;
  return buckets.map((b) => (acc += b));
};

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

  // Request clearance drives the hero gauge — real statuses only.
  const clearance = useMemo(() => {
    if (!requests.length) return null;
    const done = requests.filter((r) => !['pending', 'in_review'].includes(r.status)).length;
    return Math.round((done / requests.length) * 100);
  }, [requests]);

  // Real-user growth series: cumulative accounts per month (last 8 buckets).
  const growth = useMemo(() => cumulative(users), [users]);

  const growthRows = useMemo(
    () => growth.map((usersCount, i) => ({ bucket: `P${i + 1}`, users: usersCount })),
    [growth]
  );

  // Department health: real per-dept users + courses + member growth sparkline.
  const deptHealth = useMemo(() => {
    return departments.map((d) => {
      const id = deptId(d._id);
      const members = users.filter((u) => u.department && deptId(u.department) === id);
      const deptCourses = courses.filter((c) => c.department && deptId(c.department) === id);
      const series = cumulative(members);
      const status = members.length && deptCourses.length ? 'open' : members.length || deptCourses.length ? 'pending' : 'closed';
      const statusLabel = members.length && deptCourses.length ? 'Healthy' : members.length || deptCourses.length ? 'Watch' : 'Empty';
      return { _id: id || d.name, name: d.name || d.code || 'Department', members: members.length, deptCourses: deptCourses.length, series, status, statusLabel };
    });
  }, [departments, users, courses]);

  if (loading) return <LoadingState label="Reading institution pulse…" />;
  if (failed) return <ErrorState message="Couldn't load institution data." onRetry={load} />;

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      {/* REGION 1 — Campus pulse hero */}
      <motion.section variants={staggerChild} className={HERO} aria-label="Campus pulse">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1 basis-64">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A7D700]" aria-hidden />
              Institution Pulse
            </p>
            <h1 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight">
              Institution <em className="cf-display font-normal">pulse.</em>
            </h1>
            <p className="mt-2 text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
              <AnimatedCounter value={users.length} />
            </p>
            <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
              people · {departments.length} departments · {courses.length} courses
              {pending.length ? ` · ${pending.length} requests need review` : ' · queues are clear'}.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {Object.entries(roleMix).map(([role, n]) => (
                <Badge key={role} role={role}>{role.replace(/_/g, ' ')} · {n}</Badge>
              ))}
            </div>
          </div>
          {clearance != null && (
            <AttendanceRing value={clearance} label="Request clearance" />
          )}
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        {/* REGION 2 — growth trend, primary surface (~65%) */}
        <motion.section variants={staggerChild} className={`${PANEL} lg:col-span-2`} aria-label="Community growth">
          <h2 className="font-display text-base font-semibold mb-1">Community growth</h2>
          <p className="text-xs text-[var(--cf-ink-mute)] mb-3">Cumulative accounts over time · {users.length} total.</p>
          <Suspense fallback={<Sparkline points={growth} width={420} height={90} />}>
            <TrendChart data={growthRows} xKey="bucket" lines={[{ key: 'users', color: '#2563FF' }]} height={200} />
          </Suspense>
        </motion.section>

        {/* REGION 3 — request queue stream (~35%) */}
        <motion.section variants={staggerChild} className={PANEL} aria-label="Request queue">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm">Request queue</h2>
            <Link to="/requests" className="text-xs font-medium text-[#2563FF] hover:underline">Review</Link>
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
          <Link to="/ai-reports" className={`${TASK} mt-4 flex items-center justify-between gap-2`}>
            <span>
              <span className="font-display text-sm font-bold flex items-center gap-1.5"><Sparkles size={14} className="text-[#8B5CF6]" aria-hidden /> Intelligence</span>
              <span className="block text-[11px] text-[var(--cf-ink-mute)] mt-0.5">
                {reports.length} reports · {reports.some((r) => r.provider === 'none') ? 'provider not configured' : 'provider live'}
              </span>
            </span>
            <span className="text-2xl font-bold tabular-nums"><AnimatedCounter value={reports.length} /></span>
          </Link>
        </motion.section>
      </div>

      {/* REGION 4 — department health table w/ sparklines */}
      <motion.section variants={staggerChild} className={`${PANEL} mt-4`} aria-label="Department health">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-semibold">Department health</h2>
          <Link to="/departments" className="text-xs font-medium text-[#2563FF] hover:underline">All departments</Link>
        </div>
        {deptHealth.length === 0 ? (
          <EmptyState title="No departments yet" hint="Departments will appear here." />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-[var(--cf-ink-mute)] border-b border-[var(--cf-line)]">
                  <th scope="col" className="py-2 pr-4 font-bold">Department</th>
                  <th scope="col" className="py-2 pr-4 font-bold">Members</th>
                  <th scope="col" className="py-2 pr-4 font-bold">Courses</th>
                  <th scope="col" className="py-2 pr-4 font-bold">Growth</th>
                  <th scope="col" className="py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cf-line)]">
                {deptHealth.map((d) => (
                  <tr key={d._id} className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors">
                    <td className="py-2.5 pr-4 font-medium">{d.name}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{d.members}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{d.deptCourses}</td>
                    <td className="py-2.5 pr-4">
                      {d.series.length > 1 && d.members > 0
                        ? <Sparkline points={d.series} width={120} height={32} />
                        : <span className="text-xs text-[var(--cf-ink-mute)]">—</span>}
                    </td>
                    <td className="py-2.5"><Badge status={d.status}>{d.statusLabel}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
      <p className="sr-only">Signed in as {user?.name}, {user?.role}.</p>
    </motion.div>
  );
}
