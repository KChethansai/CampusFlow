// FunnelChart — Bklit funnel-chart adaptation (JSX port, dependency-free).
// Source: https://github.com/bklit/bklit-ui (MIT © 2026 uixmat) · registry:
// https://ui.bklit.com/r/funnel-chart.json · docs: https://bklit.com/docs
// Bklit funnel-chart is motion-only (no visx): staged tapered bands with
// enter transitions. This port keeps that shape for the placement pipeline:
// trapezoid bands sized by real stage counts, royal→violet ramp, dashed
// low-opacity separators, 1.2s staggered reveal, reduced-motion off-switch.
// Props: { stages:[{label,value,color?}], title, measure, period, summary,
// emptyText, loading, className }. Real data only — no invented datasets.
import { memo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

// ponytail: royal→violet ramp mirrors the AreaChart 3-stop set.
const DEFAULT_COLORS = ['#D86D3E', '#A77B68', '#C39279', '#A77B68', '#C39279', '#25D890'];

export const FunnelChart = memo(function FunnelChart({
  stages = [],
  title,
  measure,
  period,
  summary,
  emptyText = 'No pipeline motion yet.',
  loading = false,
  className
}) {
  const reduced = useReducedMotion();
  const max = Math.max(...stages.map((s) => Number(s.value) || 0), 0);
  const total = stages.reduce((a, s) => a + (Number(s.value) || 0), 0);

  const autoSummary =
    summary ||
    (stages.length
      ? `Funnel of ${stages.length} stages, ${total} total. Widest stage: ${stages[0]?.label} at ${stages[0]?.value}.`
      : 'No funnel data yet.');

  const showEmpty = !loading && (stages.length === 0 || max === 0);

  return (
    <figure className={className} role="img" aria-label={`${title ? `${title}. ` : ''}Funnel chart. ${autoSummary}`}>
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
      {loading ? (
        <div className="grid place-items-center py-8 text-sm text-[var(--cf-ink-mute)]">Loading chart…</div>
      ) : showEmpty ? (
        <div className="grid place-items-center py-8 text-sm text-[var(--cf-ink-mute)]">{emptyText}</div>
      ) : (
        <ol className="space-y-1.5" aria-hidden>
          {stages.map((s, i) => {
            const v = Number(s.value) || 0;
            const pct = max ? Math.max(6, (v / max) * 100) : 0;
            const c = s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            return (
              <li key={s.label} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--cf-ink-mute)]">
                  {s.label}
                </span>
                <div className="relative flex-1 h-9">
                  <motion.div
                    className="absolute inset-y-0 left-0 flex items-center justify-end rounded-r-[10px] pr-2"
                    style={{
                      background: `linear-gradient(90deg, ${c}59, ${c}E6)`,
                      border: '1px solid var(--cf-line)',
                      borderLeft: 'none',
                      clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)'
                    }}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: `${pct}%`, opacity: 1 }}
                    transition={{ duration: reduced ? 0 : 1.2, ease: [0.85, 0, 0.15, 1], delay: reduced ? 0 : i * 0.08 }}
                  >
                    <span className="text-xs font-bold tabular-nums text-white drop-shadow">{v}</span>
                  </motion.div>
                  <span className="absolute inset-x-0 top-full border-t border-dashed border-[var(--cf-line)] opacity-45" aria-hidden />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <figcaption className="sr-only">{autoSummary}</figcaption>
      <table className="sr-only">
        <caption>{title || 'Funnel data'}</caption>
        <thead>
          <tr><th scope="col">Stage</th><th scope="col">Count</th></tr>
        </thead>
        <tbody>
          {stages.map((s) => (
            <tr key={s.label}>
              <th scope="row">{s.label}</th>
              <td>{String(s.value ?? '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
});

export default FunnelChart;
