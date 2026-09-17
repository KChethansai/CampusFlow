// PlacementHome: hierarchical regions — R1 pipeline hero (macro motion +
// conversion gauge + horizontal tracker), R2 conversion Area chart, R3 open
// drives stream, R4 glance task cards.
// Endpoints preserved: GET /job-drives, /job-applications, /companies.
// PIPELINE_STAGES / normalizeStage untouched. Real data only.
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, Briefcase, Building2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/primitives';
import { AnimatedCounter } from '../../components/ui/editorial';
import { AttendanceRing, PipelineLabels } from '../../components/data/views';
import { PIPELINE_STAGES, normalizeStage } from '../../system/tokens';
import { staggerChild, staggerParent } from '../../system/motion';

const TrendChart = lazy(() =>
  import('../../components/data/TrendChart')
    .then((m) => ({ default: m.TrendChart || m.default }))
    .catch(() => ({ default: () => null }))
);

const HERO = 'cf-glass rounded-[24px] border border-[var(--cf-line)] p-6 sm:p-8 relative overflow-hidden';
const PANEL = 'cf-glass rounded-[24px] border border-[var(--cf-line)] p-5';
const TASK = 'rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface)] p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg';

export default function PlacementHome() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    const [d, a, c] = await Promise.allSettled([
      api.get('/job-drives'), api.get('/job-applications'), api.get('/companies')
    ]);
    let ok = false;
    if (d.status === 'fulfilled') { setDrives(d.value.data.data || []); ok = true; }
    if (a.status === 'fulfilled') { setApplications(a.value.data.data || []); ok = true; }
    if (c.status === 'fulfilled') { setCompanies(c.value.data.data || []); ok = true; }
    if (!ok) setFailed(true);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const funnel = useMemo(() => {
    const counts = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, 0]));
    let rejected = 0;
    applications.forEach((a) => {
      if (a.stage === 'rejected') rejected++;
      else {
        const n = normalizeStage(a.stage);
        if (n in counts) counts[n]++;
      }
    });
    return { counts, rejected, total: applications.length };
  }, [applications]);

  // Conversion gauge: offers + placed over all non-rejected motion.
  const conversion = useMemo(() => {
    const live = funnel.total - funnel.rejected;
    if (!live) return null;
    return Math.round(((funnel.counts.offer + funnel.counts.placed) / live) * 100);
  }, [funnel]);

  // Conversion area chart: cumulative applications + cumulative wins over time.
  const conversionRows = useMemo(() => {
    const sorted = [...applications].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    if (!sorted.length) return [];
    const N = 8;
    const buckets = Array.from({ length: N }, (_, i) => ({ bucket: `P${i + 1}`, applications: 0, wins: 0 }));
    let acc = 0;
    let wins = 0;
    sorted.forEach((a, i) => {
      const b = Math.min(N - 1, Math.floor((i / sorted.length) * N));
      acc++;
      if (['offer', 'placed'].includes(a.stage)) wins++;
      buckets[b] = { ...buckets[b], applications: acc, wins };
    });
    let lastA = 0;
    let lastW = 0;
    return buckets.map((r) => {
      lastA = Math.max(lastA, r.applications);
      lastW = Math.max(lastW, r.wins);
      return { bucket: r.bucket, applications: lastA, wins: lastW };
    });
  }, [applications]);

  const openDrives = useMemo(
    () => drives.filter((d) => d.status === 'active').slice(0, 4),
    [drives]
  );

  const maxStage = useMemo(
    () => Math.max(1, ...PIPELINE_STAGES.map((s) => funnel.counts[s])),
    [funnel]
  );

  if (loading) return <LoadingState label="Mapping career paths…" />;
  if (failed) return <ErrorState message="Couldn't load placement data." onRetry={load} />;

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      {/* REGION 1 — pipeline hero */}
      <motion.section variants={staggerChild} className={HERO} aria-label="Pipeline pulse">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1 basis-64">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A7D700]" aria-hidden />
              {isStudent ? 'Your career track' : 'Placement control'}
            </p>
            <h1 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight">
              Classroom to <em className="cf-display font-normal">career.</em>
            </h1>
            <p className="mt-2 text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
              <AnimatedCounter value={funnel.total} />
            </p>
            <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
              {isStudent
                ? `application${funnel.total === 1 ? '' : 's'} in motion · ${openDrives.length} drives open.`
                : `${drives.length} drives · ${companies.length} companies · ${funnel.total} applications in the ecosystem.`}
            </p>
            <Link to="/placement" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2563FF] hover:underline">
              Full board <ArrowRight size={13} aria-hidden />
            </Link>
          </div>
          {conversion != null && (
            <AttendanceRing value={conversion} label="Offer conversion" />
          )}
        </div>
        {/* horizontal pipeline tracker — real counts */}
        <div className="mt-6 flex items-stretch gap-1.5" role="img" aria-label={`Pipeline counts: ${PIPELINE_STAGES.map((s) => `${s} ${funnel.counts[s]}`).join(', ')}`}>
          {PIPELINE_STAGES.map((s) => (
            <div key={s} className="flex-1 min-w-0">
              <div className="rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface)]/60 px-1 py-2.5 text-center">
                <p className="text-xl font-bold tabular-nums leading-none"><AnimatedCounter value={funnel.counts[s]} /></p>
                <div className="mx-2 mt-2 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden" aria-hidden>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((funnel.counts[s] / maxStage) * 100)}%`, background: funnel.counts[s] ? '#2563FF' : 'transparent' }} />
                </div>
              </div>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide truncate text-center text-[var(--cf-ink-mute)]">{s}</p>
            </div>
          ))}
        </div>
        <PipelineLabels current={applications[0]?.stage || 'applied'} />
      </motion.section>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        {/* REGION 2 — conversion area chart (~65%) */}
        <motion.section variants={staggerChild} className={`${PANEL} lg:col-span-2`} aria-label="Conversion analytics">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-base font-semibold flex items-center gap-2">
              <Briefcase size={17} className="text-[#8B5CF6]" aria-hidden /> Conversion analytics
            </h2>
            <Link to="/placement" className="text-xs font-medium text-[#2563FF] hover:underline">Marketplace</Link>
          </div>
          <p className="text-xs text-[var(--cf-ink-mute)] mb-3">Cumulative applications vs wins · {funnel.total} total.</p>
          {conversionRows.length ? (
            <Suspense fallback={<p className="text-sm text-[var(--cf-ink-mute)]">Loading chart…</p>}>
              <TrendChart
                data={conversionRows}
                xKey="bucket"
                lines={[{ key: 'applications', color: '#2563FF' }, { key: 'wins', color: '#8B5CF6' }]}
                height={200}
              />
            </Suspense>
          ) : (
            <EmptyState title="No pipeline motion yet" hint="Applications will chart here." />
          )}
        </motion.section>

        {/* REGION 3 — open drives stream (~35%) */}
        <motion.section variants={staggerChild} className={PANEL} aria-label="Open drives">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold">Open drives</h2>
            <Link to="/placement" className="text-xs font-medium text-[#2563FF] hover:underline">All</Link>
          </div>
          {openDrives.length === 0 ? (
            <p className="text-sm text-[var(--cf-ink-mute)] py-4 text-center">No open drives right now.</p>
          ) : (
            <ul className="divide-y divide-[var(--cf-line)]">
              {openDrives.map((d) => (
                <li key={d._id}>
                  <Link to="/placement" className="flex items-center gap-3 py-2.5 group">
                    <span className="grid place-items-center w-9 h-9 shrink-0 rounded-[14px] bg-[#2563FF]/10 text-[#2563FF]" aria-hidden>
                      <Building2 size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate group-hover:text-[#2563FF] transition">{d.role} · {d.company?.name}</span>
                      <span className="block text-xs text-[var(--cf-ink-mute)]">{d.location || ''}{d.packageLPA ? ` · ${d.packageLPA} LPA` : ''}</span>
                    </span>
                    <Badge status="open">Apply</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      {/* REGION 4 — glance task cards */}
      <motion.div variants={staggerChild} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {[
          ['Open drives', openDrives.length],
          ['Companies', companies.length],
          ['Applications', funnel.total],
          ['Offers', funnel.counts.offer + funnel.counts.placed]
        ].map(([label, value]) => (
          <div key={label} className={TASK}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--cf-ink-mute)]">{label}</p>
            <p className="text-3xl font-bold tabular-nums"><AnimatedCounter value={value} /></p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
