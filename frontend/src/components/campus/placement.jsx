// Campus placement widgets — thin wrappers over regions + data/views.
// Stage math (normalizeStage/PIPELINE_STAGES) lives in callers; this file
// only renders the counts it is given. PATCH/apply logic untouched.
import { memo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Building2, MapPin, Wallet } from 'lucide-react';
import { cn } from '../../system/tokens';
import { btnClass } from '../../system/tokens';
import { AnimatedCounter } from '../ui/editorial';
import { Badge } from '../ui/primitives';
import { PIPELINE_STAGES } from '../../system/tokens';

/** Bklit-style funnel: per-stage counts + stage-to-stage conversion. */
export const PipelineFunnel = memo(function PipelineFunnel({ counts = {}, rejected = 0, total = 0 }) {
  const max = Math.max(1, ...PIPELINE_STAGES.map((s) => counts[s] || 0));
  return (
    <div role="img" aria-label={`Pipeline counts: ${PIPELINE_STAGES.map((s) => `${s} ${counts[s] || 0}`).join(', ')}${rejected ? `, rejected ${rejected}` : ''}`}>
      <ul className="space-y-2.5">
        {PIPELINE_STAGES.map((s, i) => {
          const n = counts[s] || 0;
          const prev = i === 0 ? total - rejected || n : counts[PIPELINE_STAGES[i - 1]] || 0;
          const conv = i === 0 || !prev ? null : Math.round((n / prev) * 100);
          return (
            <li key={s} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-wide text-[var(--cf-ink-mute)] truncate">
                {s}
              </span>
              <span className="flex-1 min-w-0 h-9 rounded-[10px] bg-black/[.05] dark:bg-white/[.06] overflow-hidden">
                <motion.span
                  className="flex h-full items-center justify-end rounded-[10px] px-2 text-xs font-bold text-white tabular-nums"
                  style={{ background: 'linear-gradient(90deg, #D86D3E, #A77B68)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(n ? 12 : 0, Math.round((n / max) * 100))}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  {n > 0 && <AnimatedCounter value={n} />}
                </motion.span>
              </span>
              <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-[var(--cf-ink-mute)]">
                {conv == null ? (i === 0 ? 'entry' : '—') : `${conv}%`}
              </span>
            </li>
          );
        })}
      </ul>
      {rejected > 0 && (
        <p className="mt-2.5 text-[11px] text-[var(--cf-ink-mute)]">
          {rejected} rejected · kept out of the live funnel so conversion stays honest.
        </p>
      )}
    </div>
  );
});

/** Drive card: spotlight hover-lift over the marketplace surface. */
export const DriveCard = memo(function DriveCard({
  drive,
  applied,
  busy,
  isStudent,
  onDetails,
  onApply,
  variants
}) {
  const d = drive;
  return (
    <motion.article
      variants={variants}
      layout
      className="cf-card-spot cf-glass rounded-[24px] border border-[var(--cf-line)] p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="grid place-items-center w-10 h-10 shrink-0 rounded-[14px] bg-[#D86D3E]/10 text-[#D86D3E]" aria-hidden>
          <Building2 size={19} />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold leading-tight truncate">{d.role}</h3>
          <p className="text-xs text-[var(--cf-ink-mute)] truncate">{d.company?.name}</p>
        </div>
        <span className="ml-auto">
          <Badge status={d.status || 'active'}>{d.status || 'active'}</Badge>
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--cf-ink-mute)] mb-3">
        {d.packageLPA && (
          <span className="flex items-center gap-1 font-semibold text-[var(--cf-ink)]">
            <Wallet size={13} aria-hidden /> {d.packageLPA} LPA
          </span>
        )}
        {d.location && (
          <span className="flex items-center gap-1">
            <MapPin size={13} aria-hidden /> {d.location}
          </span>
        )}
        {d.jobType && <span className="capitalize">{d.jobType}</span>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-[var(--cf-ink-mute)]">
          Apply by {d.applicationDeadline ? new Date(d.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
        </span>
        <span className="flex gap-1.5">
          <button onClick={onDetails} className={btnClass('outline', 'small')}>Details</button>
          {isStudent && !applied && d.status === 'active' && (
            <button onClick={onApply} disabled={busy} className={btnClass('primary', 'small')}>
              {busy ? 'Applying…' : 'Apply now'}
            </button>
          )}
          {isStudent && applied && <Badge status="applied">Applied</Badge>}
        </span>
      </div>
    </motion.article>
  );
});

/** Compact pipeline row for glance cards / streams. */
export function PipelineRow({ application, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className={cn(
        'w-full text-left px-4 py-3.5 flex items-center gap-3 rounded-[14px]',
        'hover:bg-black/[.02] dark:hover:bg-white/[.03] transition'
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium truncate">
          {application.student?.name || 'Applicant'} → {application.drive?.role || 'Drive'}
        </span>
        <span className="block text-xs text-[var(--cf-ink-mute)]">{application.drive?.company?.name || ''}</span>
      </span>
      <Badge status={application.stage || 'applied'}>{(application.stage || 'applied').replace(/_/g, ' ')}</Badge>
      <ArrowRight size={15} className="text-[var(--cf-ink-mute)]" aria-hidden />
    </button>
  );
}
