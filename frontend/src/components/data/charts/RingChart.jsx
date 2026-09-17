// RingChart — Bklit ring-chart adaptation (JSX port, dependency-free).
// Source: https://github.com/bklit/bklit-ui (MIT © 2026 uixmat) · registry:
// https://ui.bklit.com/r/ring-chart.json · docs: https://bklit.com/docs
// Bklit ring-chart is a composable donut (visx group/responsive/shape +
// motion) with progress segments and center readout. This port keeps
// multi-segment arcs, dashed low-opacity separators, 1.2s staggered draw,
// reduced-motion off-switch — pure SVG + motion, no new peer dep.
// Props: { segments:[{label,value,color?}], size=140, centerLabel,
// title, measure, period, summary, emptyText, loading, className }.
import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const DEFAULT_COLORS = ['#2563FF', '#8B5CF6', '#25D890', '#FFBD4A', '#FF5964'];

export const RingChart = memo(function RingChart({
  segments = [],
  size = 140,
  centerLabel,
  title,
  measure,
  period,
  summary,
  emptyText = 'Nothing to break down yet.',
  loading = false,
  className
}) {
  const reduced = useReducedMotion();
  const total = useMemo(
    () => segments.reduce((a, s) => a + (Number(s.value) || 0), 0),
    [segments]
  );

  const arcs = useMemo(() => {
    if (!total) return [];
    let acc = 0;
    const R = 52;
    const C = 2 * Math.PI * R;
    return segments.map((s, i) => {
      const frac = (Number(s.value) || 0) / total;
      const arc = { ...s, frac, offset: acc, C, R, color: s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] };
      acc += frac;
      return arc;
    });
  }, [segments, total]);

  const autoSummary =
    summary ||
    (total
      ? `${segments.length} segments totaling ${total}. Largest: ${arcs[0]?.label} at ${Math.round((arcs[0]?.frac || 0) * 100)} percent.`
      : 'No ring data yet.');

  const showEmpty = !loading && (!segments.length || !total);

  return (
    <figure className={className} role="img" aria-label={`${title ? `${title}. ` : ''}Ring chart. ${autoSummary}`}>
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
        <div className="grid place-items-center text-sm text-[var(--cf-ink-mute)]" style={{ height: size }}>Loading chart…</div>
      ) : showEmpty ? (
        <div className="grid place-items-center text-sm text-[var(--cf-ink-mute)]" style={{ height: size }}>{emptyText}</div>
      ) : (
        <div className="flex items-center gap-4">
          <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden className="shrink-0">
            <circle cx="60" cy="60" r={52} fill="none" strokeWidth="12" stroke="var(--cf-line)" opacity={0.6} />
            {arcs.map((a, i) => (
              <motion.circle
                key={a.label}
                cx="60"
                cy="60"
                r={a.R}
                fill="none"
                stroke={a.color}
                strokeWidth="12"
                strokeLinecap="butt"
                strokeDasharray={`${Math.max(0, a.frac * a.C - 2)} ${a.C}`}
                transform={`rotate(${-90 + a.offset * 360} 60 60)`}
                opacity={0.92}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.92 }}
                transition={{ duration: reduced ? 0 : 1.2, ease: [0.85, 0, 0.15, 1], delay: reduced ? 0 : i * 0.1 }}
              />
            ))}
            <text x="60" y="58" textAnchor="middle" fontSize="22" fontWeight="800" className="fill-[var(--cf-ink)] tabular-nums">
              {total}
            </text>
            <text x="60" y="73" textAnchor="middle" fontSize="9" className="fill-[var(--cf-ink-mute)]">
              {(centerLabel || 'total').slice(0, 20)}
            </text>
          </svg>
          <ul className="space-y-1 text-xs">
            {arcs.map((a) => (
              <li key={a.label} className="flex items-center gap-1.5 text-[var(--cf-ink-mute)]">
                <span aria-hidden className="w-2.5 h-2.5 rounded-[4px]" style={{ background: a.color }} />
                <span className="font-medium text-[var(--cf-ink)]">{a.label}</span>
                <span className="tabular-nums">{a.value} · {Math.round(a.frac * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <figcaption className="sr-only">{autoSummary}</figcaption>
      <table className="sr-only">
        <caption>{title || 'Ring data'}</caption>
        <thead>
          <tr><th scope="col">Segment</th><th scope="col">Value</th></tr>
        </thead>
        <tbody>
          {segments.map((s) => (
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

export default RingChart;
