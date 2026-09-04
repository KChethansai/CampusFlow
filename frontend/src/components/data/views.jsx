// Shared data views: timeline, pipeline, ring, sparkline, heatmap.
// Pure SVG — no chart dependency. All normalized to CampusFlow tokens.
import { normalizeStage, PIPELINE_STAGES, statusBadge } from '../../system/tokens';
import { cn } from '../../system/tokens';

export function WorkflowTimeline({ steps }) {
  // steps: [{ label, at, done, active, note }]
  return (
    <ol className="relative ml-2 border-l-2 border-[var(--cf-line)] space-y-4 pl-5 py-1" aria-label="Progress timeline">
      {steps.map((s, i) => (
        <li key={i} className="relative">
          <span
            aria-hidden
            className={cn(
              'absolute -left-[27px] top-0.5 w-3 h-3 rounded-full border-2',
              s.done
                ? 'bg-green-500 border-green-500'
                : s.active
                  ? 'bg-primary-500 border-primary-500 animate-pulse'
                  : 'bg-[var(--cf-surface)] border-[var(--cf-line)]'
            )}
          />
          <p className={cn('text-sm font-medium', s.done || s.active ? 'text-[var(--cf-ink)]' : 'text-[var(--cf-ink-mute)]')}>
            {s.label}
          </p>
          {s.note && <p className="text-xs text-[var(--cf-ink-mute)] mt-0.5">{s.note}</p>}
          {s.at && <p className="text-[11px] text-[var(--cf-ink-mute)]">{s.at}</p>}
        </li>
      ))}
    </ol>
  );
}

export function PipelineStages({ current, compact }) {
  const idx = PIPELINE_STAGES.indexOf(normalizeStage(current));
  return (
    <div className="flex items-center gap-1" role="list" aria-label={`Pipeline stage: ${current}`}>
      {PIPELINE_STAGES.map((stage, i) => {
        const done = idx >= 0 && i < idx;
        const active = stage === normalizeStage(current);
        return (
          <div key={stage} role="listitem" aria-current={active ? 'step' : undefined}
            title={stage}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              done ? 'bg-green-500' : active ? 'bg-primary-500' : 'bg-black/10 dark:bg-white/10'
            )}
          >
            {!compact && <span className="sr-only">{stage}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function PipelineLabels({ current }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {PIPELINE_STAGES.map((stage) => {
        const active = stage === normalizeStage(current);
        const done = PIPELINE_STAGES.indexOf(normalizeStage(current)) > PIPELINE_STAGES.indexOf(stage);
        return (
          <span key={stage} className={statusBadge(active ? stage : done ? 'selected' : 'draft')}>
            {stage}
          </span>
        );
      })}
    </div>
  );
}

export function AttendanceRing({ value = 0, size = 120, label = 'Attendance Health' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = pct >= 85 ? '#16a34a' : pct >= 75 ? '#0071e3' : pct >= 60 ? '#d97706' : '#dc2626';
  return (
    <div className="flex items-center gap-4" role="img" aria-label={`${label}: ${pct} percent`}>
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="11" className="stroke-black/10 dark:stroke-white/10" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
        <text x="60" y="58" textAnchor="middle" fontSize="24" fontWeight="800" className="fill-[var(--cf-ink)]">{pct}%</text>
        <text x="60" y="74" textAnchor="middle" fontSize="9" className="fill-[var(--cf-ink-mute)]">health</text>
      </svg>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-[var(--cf-ink-mute)] mt-0.5">
          {pct >= 75 ? 'Above the 75% threshold.' : 'Below the 75% threshold — every class counts now.'}
        </p>
      </div>
    </div>
  );
}

export function Sparkline({ points = [], width = 220, height = 56 }) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - 6 - ((p - min) / span) * (height - 12)).toFixed(1)}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke="#0071e3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={i * step} cy={height - 6 - ((p - min) / span) * (height - 12)} r="3" fill="#0071e3" opacity={i === points.length - 1 ? 1 : 0.35} />
      ))}
    </svg>
  );
}

export function Heatmap({ weeks = [], legend = ['Less', 'More'] }) {
  // weeks: array of 7-length columns of 0..4 intensity
  const shades = [
    'bg-black/[.06] dark:bg-white/[.07]',
    'bg-green-200 dark:bg-green-500/25',
    'bg-green-300 dark:bg-green-500/45',
    'bg-green-500 dark:bg-green-500/70',
    'bg-green-600 dark:bg-green-400'
  ];
  return (
    <div>
      <div className="flex gap-1" role="img" aria-label="Activity heatmap">
        {weeks.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {col.map((v, di) => (
              <span key={di} title={`${v}/4`} className={cn('w-3.5 h-3.5 rounded-[4px]', shades[Math.max(0, Math.min(4, v))] || shades[0])} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--cf-ink-mute)]">
        <span>{legend[0]}</span>
        {shades.map((s, i) => (
          <span key={i} className={cn('w-2.5 h-2.5 rounded-[3px]', s)} aria-hidden />
        ))}
        <span>{legend[1]}</span>
      </div>
    </div>
  );
}
