// Study: rule-based study assistance — weak subjects, revision plan,
// matched resources. Computed from real records; labeled honestly as
// rule-based, never presented as LLM output.
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowUpRight, BookOpen, Brain, CalendarCheck, ExternalLink } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../store/useAuth';
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '../components/ui/primitives';
import { staggerChild, staggerParent } from '../system/motion';
import { btnClass, cn } from '../system/tokens';

export default function Study() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    api.get('/study/plan')
      .then(({ data }) => { if (live) setPlan(data.data); })
      .catch(() => { if (live) setError(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  return (
    <div>
      <PageHeader
        title="Study assistant"
        subtitle="Weak spots, a revision order and matched resources — computed from your records."
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cf-line)] px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A7D700]" aria-hidden />
              Rule-based · not AI
            </span>
            <Link to="/assignments" className={btnClass('outline', 'small')}>Open assignments <ArrowUpRight size={13} /></Link>
          </>
        }
      />

      {loading ? <LoadingState label="Reading your records…" /> : error || !plan ? (
        <Card><ErrorState message="Couldn’t build your plan right now." onRetry={() => window.location.reload()} /></Card>
      ) : (
        <motion.div {...staggerParent(0.06)} initial="initial" animate="animate" className="space-y-4">
          <motion.div variants={staggerChild}>
            <Card>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="font-display font-bold flex items-center gap-2">
                  <span className="w-8 h-8 grid place-items-center rounded-xl bg-[#2563FF]/10 text-[#2563FF]" aria-hidden>
                    <AlertTriangle size={15} />
                  </span>
                  Weak subjects
                </h2>
                <span className="rounded-full border border-[var(--cf-line)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--cf-ink-mute)] tabular-nums">
                  {plan.weakSubjects.length} to fix
                </span>
              </div>
              <p className="text-[11px] text-[var(--cf-ink-mute)] mb-3">Scores below 60% or attendance below 75%.</p>
              {plan.weakSubjects.length === 0 ? (
                <p className="flex items-center gap-1.5 rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/50 px-4 py-3 text-sm font-display font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-[#A7D700]" aria-hidden />No weak spots detected. Keep the streak. ✓</p>
              ) : (
                <ul className="space-y-2.5">
                  {plan.weakSubjects.map((w) => (
                    <li key={w.subjectId} className="rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/50 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-display font-bold">{w.name}</p>
                        <span className="flex gap-1.5">
                          {w.avgScorePct != null && <Badge status={w.avgScorePct < 60 ? 'pending' : 'open'}>score {w.avgScorePct}%</Badge>}
                          {w.attendancePct != null && <Badge status={w.attendancePct < 75 ? 'pending' : 'open'}>att. {w.attendancePct}%</Badge>}
                        </span>
                      </div>
                      <ul className="mt-1.5 space-y-0.5">
                        {w.reasons.map((r, i) => <li key={i} className="text-xs text-[var(--cf-ink-mute)]">· {r}</li>)}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-4">
            <motion.div variants={staggerChild}>
              <Card>
                <h2 className="font-display font-bold flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 grid place-items-center rounded-xl bg-violet-500/10 text-violet-500" aria-hidden>
                    <CalendarCheck size={15} />
                  </span>
                  Revision plan
                </h2>
                {plan.revisionPlan.length === 0 ? (
                  <EmptyState title="Nothing queued" hint="New deadlines and reviews will line up here." />
                ) : (
                  <ol className="space-y-2">
                    {plan.revisionPlan.map((p, i) => (
                      <li key={i} className={cn('flex items-start gap-2.5 text-sm rounded-2xl border p-2.5',
                        p.priority === 'high' ? 'border-[#2563FF]/30 bg-[#2563FF]/[.05]' : 'border-[var(--cf-line)]')}>
                        <span className="mt-0.5 w-6 h-6 rounded-full bg-[#2563FF] text-white grid place-items-center text-[11px] font-display font-bold shrink-0" aria-hidden>{i + 1}</span>
                        <span className="min-w-0">
                          <span className="block font-medium">{p.title}</span>
                          <span className="block text-xs text-[var(--cf-ink-mute)]">{p.detail}</span>
                        </span>
                        {p.priority === 'high' && <Badge status="pending" className="ml-auto shrink-0">first</Badge>}
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </motion.div>
            <motion.div variants={staggerChild}>
              <Card>
                <h2 className="font-display font-bold flex items-center gap-2 mb-1">
                  <span className="w-8 h-8 grid place-items-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-300" aria-hidden>
                    <BookOpen size={15} />
                  </span>
                  Recommended resources
                </h2>
                <p className="text-[11px] text-[var(--cf-ink-mute)] mb-3">Matched to your focus subjects by your institution.</p>
                {plan.resources.length === 0 ? (
                  <EmptyState title="No resources yet" hint="Your faculty can add readings for your subjects." />
                ) : (
                  <ul className="space-y-2">
                    {plan.resources.map((r) => (
                      <li key={r._id} className="flex items-center gap-2 text-sm rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/50 p-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium truncate">{r.title}</span>
                          <span className="block text-xs text-[var(--cf-ink-mute)]">{r.subject?.name || ''} · {r.topic} · {r.difficulty}</span>
                        </span>
                        {r.url ? (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${r.title}`} className="p-1.5 rounded-xl border border-[var(--cf-line)] hover:border-[#2563FF]/50 hover:text-[#2563FF] transition">
                            <ExternalLink size={15} />
                          </a>
                        ) : (
                          <Badge tone="bg-black/[.05] dark:bg-white/10 text-[var(--cf-ink-soft)]">{r.type}</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </motion.div>
          </div>

          <p className="rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 px-4 py-2.5 text-[11px] text-[var(--cf-ink-mute)] flex items-center gap-1.5">
            <Brain size={12} aria-hidden className="shrink-0" />
            Built from {plan.generatedFrom.gradedSubmissions} graded submissions and {plan.generatedFrom.attendanceSessions} attendance groups — {plan.generatedFrom.method}.
            {user?.role !== 'student' && ' Add ?studentId= to view another student.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
