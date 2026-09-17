// Shared data views: timeline, pipeline, ring, sparkline, heatmap.
// Pure SVG — no chart dependency. All normalized to CampusFlow tokens.
import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { normalizeStage, PIPELINE_STAGES } from '../../system/tokens';
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
          <span
            key={stage}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-[var(--cf-ink)] rounded-full px-2.5 py-0.5 shadow-brutal-sm whitespace-nowrap',
              active
                ? 'bg-volt text-coal'
                : done
                  ? 'bg-royal text-white'
                  : 'bg-[var(--cf-surface)] text-[var(--cf-ink-mute)]'
            )}
          >
            {stage.replace(/_/g, ' ')}
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
  // Neo-brutal strokes: royal (healthy) → gold (watch) → flag (risk), ink track.
  const color = pct >= 85 ? '#0055ff' : pct >= 75 ? '#ffcc00' : pct >= 60 ? '#e63b2e' : '#e63b2e';
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
      <path d={d} fill="none" stroke="#0055ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const last = i === points.length - 1;
        return (
          <circle
            key={i}
            cx={i * step}
            cy={height - 6 - ((p - min) / span) * (height - 12)}
            r={last ? 4 : 3}
            fill={last ? '#d4ff00' : '#0055ff'}
            stroke="#0055ff"
            strokeWidth={last ? 2 : 0}
            opacity={last ? 1 : 0.55}
          />
        );
      })}
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

/** Dropzone: drag-and-drop submission with progress feedback. Controlled by parent via onFiles. */
export function Dropzone({ onFiles, accept, multiple = true, progress = null, label = 'Drop files to submit' }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles?.(e.dataTransfer.files); }}
      className={cn(
        'rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer',
        dragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 scale-[1.01]' : 'border-[var(--cf-line)] hover:border-primary-300 hover:bg-black/[.02] dark:hover:bg-white/[.04]'
      )}
    >
      <UploadCloud size={22} className="mx-auto text-primary-500" aria-hidden />
      <p className="mt-2 text-sm font-medium">{label}</p>
      <p className="text-xs text-[var(--cf-ink-mute)]">or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={(e) => onFiles?.(e.target.files)}
        tabIndex={-1}
      />
      {progress != null && (
        <div className="mt-3 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
          <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
