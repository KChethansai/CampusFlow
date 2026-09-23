// Campus attendance widgets — thin wrappers over data/views primitives.
// Session math stays in callers; marking logic untouched.
import { memo } from 'react';
import { AttendanceRing, Heatmap, Sparkline } from '../data/views';
import { PANEL } from './regions';
import { cn } from '../../system/tokens';

/** Attendance pulse: ring gauge + trajectory + 4-week matrix. */
export const AttendancePulse = memo(function AttendancePulse({ health, trend = [], weeks = [], label = 'Attendance Health' }) {
  return (
    <div className="flex flex-wrap items-start gap-8">
      <div>
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)] mb-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E7A66D]" aria-hidden />
          Health
        </p>
        <AttendanceRing value={health} label={label} />
      </div>
      <div className="min-w-0 flex-1 basis-64">
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)] mb-2">
          Trend · last {trend.length} sessions
        </p>
        {trend.length > 1 ? (
          <Sparkline points={trend} width={460} height={96} />
        ) : (
          <p className="text-sm text-[var(--cf-ink-mute)]">Not enough sessions for a trend yet.</p>
        )}
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)] mt-4 mb-2">
          Activity matrix · last 4 weeks
        </p>
        <Heatmap weeks={weeks} />
      </div>
    </div>
  );
});

/** Course comparison: per-course progress bars answering "where do I bleed?". */
export const CourseBars = memo(function CourseBars({ rows = [] }) {
  return (
    <ul className="space-y-3">
      {rows.map((c) => (
        <li key={c.name}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium truncate">{c.name}</span>
            <span className="text-xs text-[var(--cf-ink-mute)] tabular-nums">
              {c.pct}% · {c.n} records
            </span>
          </div>
          <div
            className="h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden"
            role="img"
            aria-label={`${c.name} ${c.pct} percent`}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${c.pct}%`,
                background: c.pct >= 75 ? '#D86D3E' : c.pct >= 60 ? '#FFBD4A' : '#FF5964'
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
});

export function AttendancePanel({ title, children, className }) {
  return (
    <section aria-label={title} className={cn(PANEL, className)}>
      <h2 className="font-display font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}
