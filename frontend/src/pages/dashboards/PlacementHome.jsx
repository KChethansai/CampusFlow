// PlacementHome: "classroom to career" — pipeline overview + open drives + my funnel.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Briefcase, Building2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, Card, LoadingState, Stat } from '../../components/ui/primitives';
import { PipelineLabels } from '../../components/data/views';
import { PIPELINE_STAGES, normalizeStage } from '../../system/tokens';
import { staggerChild, staggerParent } from '../../system/motion';

export default function PlacementHome() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    let live = true;
    (async () => {
      const [d, a, c] = await Promise.allSettled([
        api.get('/job-drives'), api.get('/job-applications'), api.get('/companies')
      ]);
      if (!live) return;
      if (d.status === 'fulfilled') setDrives(d.value.data.data || []);
      if (a.status === 'fulfilled') setApplications(a.value.data.data || []);
      if (c.status === 'fulfilled') setCompanies(c.value.data.data || []);
      setLoading(false);
    })();
    return () => { live = false; };
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

  return (
    <motion.div {...staggerParent(0.06)} initial="initial" animate="animate">
      <motion.div variants={staggerChild} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your path from classroom to <em className="cf-display font-normal">career.</em></h1>
        <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">
          {isStudent
            ? `${funnel.total} application${funnel.total === 1 ? '' : 's'} in motion · ${openDrives.length} drives open.`
            : `${drives.length} drives · ${companies.length} companies · ${funnel.total} applications in the ecosystem.`}
        </p>
      </motion.div>

      <motion.div variants={staggerChild}>
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><Briefcase size={17} className="text-accent-violet" /> Pipeline</h2>
            <Link to="/placement" className="text-xs font-medium text-primary-600 hover:underline flex items-center gap-0.5">Full board <ArrowRight size={13} /></Link>
          </div>
          <div className="flex items-center gap-1" aria-hidden>
            {PIPELINE_STAGES.map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-2.5 rounded-full ${funnel.counts[s] ? 'bg-primary-500' : 'bg-black/10 dark:bg-white/10'}`} />
                <p className="mt-1.5 text-[11px] font-semibold">{funnel.counts[s]}</p>
                <p className="text-[10px] text-[var(--cf-ink-mute)] capitalize">{s}</p>
              </div>
            ))}
          </div>
          <PipelineLabels current={applications[0]?.stage || 'applied'} />
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div variants={staggerChild} className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Open drives</h2>
              <Link to="/placement" className="text-xs font-medium text-primary-600 hover:underline">Marketplace</Link>
            </div>
            {openDrives.length === 0 ? (
              <p className="text-sm text-[var(--cf-ink-mute)] py-4 text-center">No open drives right now.</p>
            ) : (
              <ul className="divide-y divide-[var(--cf-line)]">
                {openDrives.map((d) => (
                  <li key={d._id}>
                    <Link to="/placement" className="flex items-center gap-3 py-2.5 group">
                      <span className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-300 grid place-items-center shrink-0" aria-hidden>
                        <Building2 size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium truncate group-hover:text-primary-600 transition">{d.role} · {d.company?.name}</span>
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
        <motion.div variants={staggerChild}>
          <Card>
            <h2 className="font-semibold text-sm mb-3">At a glance</h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Open drives" value={openDrives.length} />
              <Stat label="Companies" value={companies.length} />
              <Stat label="Applications" value={funnel.total} />
              <Stat label="Offers" value={funnel.counts.offer + funnel.counts.placed} />
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
