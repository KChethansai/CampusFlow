// PlacementHome: Mission Control — Bklit Funnel + conversion + drives.
// Regions on campus shells (placement violet+blue).
// Endpoints preserved: GET /job-drives, /job-applications, /companies.
// PIPELINE_STAGES / normalizeStage untouched. Real data only.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, Briefcase, Building2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, ErrorState, LoadingState } from '../../components/ui/primitives';
import { AttendanceRing, PipelineLabels } from '../../components/data/views';
import { AnalyticsPanel, LazyChart, RoleHero, SpotTask, TaskGrid, TaskStat, ActivityStream } from '../../components/campus/regions';
import { PlacementFunnel } from '../../components/campus/analytics';
import { PipelineFunnel } from '../../components/campus/placement';
import { PIPELINE_STAGES, normalizeStage } from '../../system/tokens';
import { staggerChild, staggerParent } from '../../system/motion';

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

  if (loading) return <LoadingState label="Mapping career paths…" />;
  if (failed) return <ErrorState message="Couldn't load placement data." onRetry={load} />;

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      {/* REGION 1 — Mission Control hero: funnel + conversion gauge */}
      <motion.div variants={staggerChild}>
        <RoleHero
          accent="placement"
          kicker={isStudent ? 'Your career track' : 'Placement control'}
          title={<>Classroom to <em className="cf-display font-normal">career.</em></>}
          metric={funnel.total}
          sub={
            isStudent
              ? `application${funnel.total === 1 ? '' : 's'} in motion · ${openDrives.length} drives open.`
              : `${drives.length} drives · ${companies.length} companies · ${funnel.total} applications in the ecosystem.`
          }
          alert={
            <Link to="/placement" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#D86D3E] hover:underline">
              Full board <ArrowRight size={13} aria-hidden />
            </Link>
          }
          gauge={conversion != null && <AttendanceRing value={conversion} label="Offer conversion" />}
        >
          <PipelineFunnel counts={funnel.counts} rejected={funnel.rejected} total={funnel.total} />
          <PipelineLabels current={applications[0]?.stage || 'applied'} />
        </RoleHero>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        {/* REGION 2 — conversion analytics: is the pipeline compounding? */}
        <motion.div variants={staggerChild} className="lg:col-span-2">
          <AnalyticsPanel
            title="Conversion analytics"
            icon={<Briefcase size={17} className="text-[#A77B68]" aria-hidden />}
            question="Is the pipeline compounding?"
            period={`Cumulative applications vs wins · ${funnel.total} total`}
            tooltip="Buckets applications oldest→newest; wins counts offers + placements. A widening gap means top-of-funnel without closes."
            summary={conversion != null ? `${conversion}% of live applications convert to offer or better.` : undefined}
            empty={conversionRows.length === 0 ? 'No pipeline motion yet' : null}
            emptyHint="Applications will chart here."
            action={<Link to="/placement" className="text-xs font-medium text-[#D86D3E] hover:underline">Marketplace</Link>}
          >
            <LazyChart
              data={conversionRows}
              xKey="bucket"
              series={[{ key: 'applications', color: '#D86D3E' }, { key: 'wins', color: '#A77B68' }]}
              height={200}
            />
          </AnalyticsPanel>
        </motion.div>

        {/* REGION 3 — open drives stream */}
        <motion.section variants={staggerChild} className="cf-glass rounded-[24px] border border-[var(--cf-line)] p-5" aria-label="Open drives">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold">Open drives</h2>
            <Link to="/placement" className="text-xs font-medium text-[#D86D3E] hover:underline">All</Link>
          </div>
          {openDrives.length === 0 ? (
            <p className="text-sm text-[var(--cf-ink-mute)] py-4 text-center">No open drives right now.</p>
          ) : (
            <ActivityStream
              label="Open drives"
              items={openDrives}
              renderItem={(d) => (
                <Link to="/placement" className="flex items-center gap-3 py-2.5 group">
                  <span className="grid place-items-center w-9 h-9 shrink-0 rounded-[14px] bg-[#D86D3E]/10 text-[#D86D3E]" aria-hidden>
                    <Building2 size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate group-hover:text-[#D86D3E] transition">{d.role} · {d.company?.name}</span>
                    <span className="block text-xs text-[var(--cf-ink-mute)]">{d.location || ''}{d.packageLPA ? ` · ${d.packageLPA} LPA` : ''}</span>
                  </span>
                  <Badge status="open">Apply</Badge>
                </Link>
              )}
            />
          )}
        </motion.section>
      </div>

      {/* REGION 4 — glance task cards */}
      <motion.div variants={staggerChild}>
        <TaskGrid>
          <SpotTask to="/placement" label="Open drives">
            <TaskStat label="Open drives" value={openDrives.length} />
          </SpotTask>
          <SpotTask to="/placement" label="Open companies">
            <TaskStat label="Companies" value={companies.length} />
          </SpotTask>
          <SpotTask to="/placement" label="Open applications">
            <TaskStat label="Applications" value={funnel.total} />
          </SpotTask>
          <SpotTask to="/placement" label="Open offers">
            <TaskStat label="Offers" value={funnel.counts.offer + funnel.counts.placed} />
          </SpotTask>
        </TaskGrid>
      </motion.div>
      <motion.div variants={staggerChild} className="mt-4">
        <PlacementFunnel />
      </motion.div>
    </motion.div>
  );
}
