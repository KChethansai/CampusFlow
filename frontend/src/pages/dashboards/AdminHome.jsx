// AdminHome: institutional command center — pulse, health, queues.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, Building2, Inbox, Sparkles, Users } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, Card, LoadingState, Stat } from '../../components/ui/primitives';
import { Sparkline } from '../../components/data/views';
import { staggerChild, staggerParent } from '../../system/motion';

export default function AdminHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    let live = true;
    (async () => {
      const [u, d, c, r, ai] = await Promise.allSettled([
        api.get('/users'), api.get('/departments'), api.get('/courses'),
        api.get('/requests'), api.get('/ai-reports')
      ]);
      if (!live) return;
      if (u.status === 'fulfilled') setUsers(u.value.data.data || []);
      if (d.status === 'fulfilled') setDepartments(d.value.data.data || []);
      if (c.status === 'fulfilled') setCourses(c.value.data.data || []);
      if (r.status === 'fulfilled') setRequests(r.value.data.data || []);
      if (ai.status === 'fulfilled') setReports(ai.value.data.data || []);
      setLoading(false);
    })();
    return () => { live = false; };
  }, []);

  const roleMix = useMemo(() => {
    const m = {};
    users.forEach((u) => { m[u.role] = (m[u.role] || 0) + 1; });
    return m;
  }, [users]);
  const pending = useMemo(() => requests.filter((r) => ['pending', 'in_review'].includes(r.status)), [requests]);
  const growth = useMemo(() => {
    // Cumulative user growth buckets (last 8) as a pseudo-trend.
    const sorted = [...users].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    const buckets = Array(8).fill(0);
    sorted.forEach((_, i) => { buckets[Math.min(7, Math.floor((i / Math.max(1, sorted.length)) * 8))]++; });
    let acc = 0;
    return buckets.map((b) => (acc += b));
  }, [users]);

  if (loading) return <LoadingState label="Reading institution pulse…" />;

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      <motion.div variants={staggerChild} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Institution <em className="cf-display font-normal">pulse.</em></h1>
        <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
          {users.length} people · {departments.length} departments · {courses.length} courses
          {pending.length ? ` · ${pending.length} requests need review` : ' · queues are clear'}.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { to: '/users', Icon: Users, label: 'People', value: users.length, sub: `${roleMix.student || 0} students · ${roleMix.faculty || 0} faculty` },
          { to: '/departments', Icon: Building2, label: 'Departments', value: departments.length, sub: 'Across the institution' },
          { to: '/courses', Icon: BookOpen, label: 'Courses', value: courses.length, sub: 'Active catalog' },
          { to: '/requests', Icon: Inbox, label: 'Open requests', value: pending.length, sub: 'Pending + in review' }
        ].map(({ to, Icon, label, value, sub }) => (
          <motion.div key={label} variants={staggerChild}>
            <Link to={to} className="block p-4 rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-line)] shadow-1 hover:shadow-3 hover:-translate-y-0.5 transition-all">
              <span className="flex items-center gap-2 text-[var(--cf-ink-mute)]"><Icon size={16} /><span className="text-xs font-medium uppercase tracking-wide">{label}</span></span>
              <span className="block text-3xl font-bold mt-1">{value}</span>
              <span className="block text-xs text-[var(--cf-ink-mute)] mt-0.5">{sub}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div variants={staggerChild} className="lg:col-span-2">
          <Card>
            <h2 className="font-semibold mb-1">Community growth</h2>
            <p className="text-xs text-[var(--cf-ink-mute)] mb-3">Cumulative accounts over time.</p>
            <Sparkline points={growth} width={420} height={90} />
            <div className="flex flex-wrap gap-1.5 mt-4">
              {Object.entries(roleMix).map(([role, n]) => (
                <Badge key={role} role={role}>{role.replace(/_/g, ' ')} · {n}</Badge>
              ))}
            </div>
          </Card>
        </motion.div>
        <motion.div variants={staggerChild} className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm">Request queue</h2>
              <Link to="/requests" className="text-xs font-medium text-primary-600 hover:underline">Review</Link>
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
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm flex items-center gap-1.5"><Sparkles size={14} /> Intelligence</h2>
              <Link to="/ai-reports" className="text-xs font-medium text-primary-600 hover:underline">Open</Link>
            </div>
            <Stat label="Reports generated" value={reports.length} sub={reports.some((r) => r.provider === 'none') ? 'AI provider not configured' : 'Provider live'} />
          </Card>
        </motion.div>
      </div>
      <p className="sr-only">Signed in as {user?.name}, {user?.role}.</p>
    </motion.div>
  );
}
