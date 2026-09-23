// HeatmapChart — Bklit heatmap-chart adaptation (JSX port, dependency-free).
// Source: https://github.com/bklit/bklit-ui (MIT © 2026 uixmat) · registry:
// https://ui.bklit.com/r/heatmap-chart.json · docs: https://bklit.com/docs
// Bklit heatmap-chart is a contribution heatmap (visx group/heatmap/pattern/
// responsive/scale + motion) with animated cells and level colors. This port
// keeps the week-column matrix, royal→violet level scale, staggered cell
// fade, legend, reduced-motion off-switch — divs + motion, no new peer dep.
// Props: { weeks (7-length columns of 0..4), legend, title, measure, period,
// summary, emptyText, loading, className }. Same shape as views.jsx Heatmap.
import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../../system/tokens';

const SHADES = [
  'bg-black/[.06] dark:bg-white/[.07]',
  'bg-[#D86D3E]/15 dark:bg-[#D86D3E]/25',
  'bg-[#D86D3E]/35 dark:bg-[#D86D3E]/45',
  'bg-[#D86D3E]/60 dark:bg-[#D86D3E]/70',
  'bg-[#A77B68] dark:bg-[#A77B68]'
];

export const HeatmapChart = memo(function HeatmapChart({
  weeks = [],
  legend = ['Less', 'More'],
  title,
  measure,
  period,
  summary,
  emptyText = 'No activity recorded yet.',
  loading = false,
  className
}) {
  const reduced = useReducedMotion();
  const cells = useMemo(
    () => weeks.reduce((a, col) => a + col.filter((v) => Number(v) > 0).length, 0),
    [weeks]
  );

  const autoSummary =
    summary ||
    (weeks.length
      ? `Activity across ${weeks.length} weeks with ${cells} active cells.`
      : 'No heatmap data yet.');

  const showEmpty = !loading && (weeks.length === 0 || cells === 0);

  return (
    <figure className={className} role="img" aria-label={`${title ? `${title}. ` : ''}Activity heatmap. ${autoSummary}`}>
      {(title || measure || period) && (
        <div className="flex items-baseline justify-between gap-2 mb-2">
          {title && <h3 className="font-display text-sm font-semibold text-[var(--cf-ink)]">{title}</h3>}
          {(measure || period) && (
            <p className="text-xs text-[var(--cf-ink-mute)] tabular-nums">
              {measure} {period && <span>· {period}</span>}
            </p>
          )}
        </div>
      )}
      <div className="cf-glass rounded-[14px] border border-[var(--cf-line)] p-3 inline-block">
        {loading ? (
          <p className="text-sm text-[var(--cf-ink-mute)] px-4 py-3">Loading chart…</p>
        ) : showEmpty ? (
          <p className="text-sm text-[var(--cf-ink-mute)] px-4 py-3">{emptyText}</p>
        ) : (
          <>
            <div className="flex gap-1" aria-hidden>
              {weeks.map((col, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {col.map((v, di) => {
                    const level = Math.max(0, Math.min(4, Number(v) || 0));
                    return (
                      <motion.span
                        key={di}
                        title={`${level}/4`}
                        className={cn('w-3.5 h-3.5 rounded-[4px]', SHADES[level])}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : Math.min(1.2, (wi * 7 + di) * 0.012) }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--cf-ink-mute)]">
              <span>{legend[0]}</span>
              {SHADES.map((s, i) => (
                <span key={i} className={cn('w-2.5 h-2.5 rounded-[3px]', s)} aria-hidden />
              ))}
              <span>{legend[1]}</span>
            </div>
          </>
        )}
      </div>
      <figcaption className="sr-only">{autoSummary}</figcaption>
      <table className="sr-only">
        <caption>{title || 'Heatmap data'}</caption>
        <tbody>
          {weeks.map((col, wi) => (
            <tr key={wi}>
              <th scope="row">Week {wi + 1}</th>
              {col.map((v, di) => (
                <td key={di}>{String(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
});

export default HeatmapChart;
