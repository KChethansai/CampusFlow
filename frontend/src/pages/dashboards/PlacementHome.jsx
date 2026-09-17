// PlacementHome: pipeline bar with real counts via normalizeStage → open
// drives → stats. Student vs officer views follow existing logic only.
// Endpoints preserved: GET /job-drives, /job-applications, /companies.
// PIPELINE_STAGES / normalizeStage untouched.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, Briefcase, Building2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, Card, ErrorState, LoadingState } from '../../components/ui/primitives';
import { AnimatedCounter } from '../../components/ui/editorial';
import { PipelineLabels } from '../../components/data/views';
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

  const openDrives = useMemo(
    () => drives.filter((d) => d.status === 'active').slice(0, 4),
    [drives]
  );

  if (loading) return <LoadingState label="Mapping career paths…" />;
  if (failed) return <ErrorState message="Couldn't load placement data." onRetry={load} />;

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      <motion.div variants={staggerChild} className="mb-5">
        <span className="brutal-tag inline-block bg-volt px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest">★ {isStudent ? 'Your career track' : 'Placement control'}</span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">Your path from classroom to <em className="cf-display font-normal">career.</em></h1>
        <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
          {isStudent
            ? `${funnel.total} application${funnel.total === 1 ? '' : 's'} in motion · ${openDrives.length} drives open.`
            : `${drives.length} drives · ${companies.length} companies · ${funnel.total} applications in the ecosystem.`}
        </p>
      </motion.div>

      {/* pipeline bar — real counts */}
      <motion.div variants={staggerChild}>
        <div className="card-brutal mb-4 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold flex items-center gap-2"><Briefcase size={17} className="text-accent-violet" aria-hidden /> Pipeline</h2>
            <Link to="/placement" className="text-xs font-medium text-primary-600 dark:text-primary-300 hover:underline flex items-center gap-0.5">Full board <ArrowRight size={13} aria-hidden /></Link>
          </div>
          <div className="flex items-stretch gap-1.5" role="img" aria-label={`Pipeline counts: ${PIPELINE_STAGES.map((s) => `${s} ${funnel.counts[s]}`).join(', ')}`}>
            {PIPELINE_STAGES.map((s, i) => (
              <div key={s} className="flex-1 min-w-0">
                <div className={`border-2 border-[var(--cf-ink)] px-1 py-2 text-center ${funnel.counts[s] ? 'bg-gold text-coal' : 'bg-[var(--cf-surface-2)] text-[var(--cf-ink)]'}`}>
                  <p className="text-xl font-bold tabular-nums leading-none"><AnimatedCounter value={funnel.counts[s]} /></p>
                </div>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide truncate">{s}</p>
                {i < PIPELINE_STAGES.length - 1 && <span className="sr-only">→</span>}
              </div>
            ))}
          </div>
          <div className="racing-stripe h-1.5 mt-4 border border-[var(--cf-ink)]" aria-hidden />
          <PipelineLabels current={applications[0]?.stage || 'applied'} />
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* open drives */}
        <motion.div variants={staggerChild} className="lg:col-span-2">
          <Card className="role-card-animated">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold">Open drives</h2>
              <Link to="/placement" className="text-xs font-medium text-primary-600 dark:text-primary-300 hover:underline">Marketplace</Link>
            </div>
            {openDrives.length === 0 ? (
              <p className="text-sm text-[var(--cf-ink-mute)] py-4 text-center">No open drives right now.</p>
            ) : (
              <ul className="divide-y divide-[var(--cf-line)]">
                {openDrives.map((d) => (
                  <li key={d._id}>
                    <Link to="/placement" className="flex items-center gap-3 py-2.5 group">
                      <span className="brutal-tag grid place-items-center w-9 h-9 shrink-0 bg-[var(--cf-surface-2)]" aria-hidden>
                        <Building2 size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium truncate group-hover:text-primary-600 dark:group-hover:text-primary-300 transition">{d.role} · {d.company?.name}</span>
                        <span className="block text-xs text-[var(--cf-ink-mute)]">{d.location || ''}{d.packageLPA ? ` · ${d.packageLPA} LPA` : ''} · {d.jobType || ''}</span>
                      </span>
                      <Badge status="open">Apply</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </motion.div>
        {/* stats */}
        <motion.div variants={staggerChild}>
          <Card className="role-card-animated">
            <h2 className="font-display text-base font-semibold mb-3">At a glance</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Open drives', openDrives.length],
                ['Companies', companies.length],
                ['Applications', funnel.total],
                ['Offers', funnel.counts.offer + funnel.counts.placed]
              ].map(([label, value]) => (
                <div key={label} className="border-2 border-[var(--cf-ink)] p-3 bg-[var(--cf-surface-2)]">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--cf-ink-mute)]">{label}</p>
                  <p className="text-2xl font-bold tabular-nums"><AnimatedCounter value={value} /></p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
