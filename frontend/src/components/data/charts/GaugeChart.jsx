// GaugeChart — Bklit gauge-chart adaptation (JSX port, dependency-free).
// Source: https://github.com/bklit/bklit-ui (MIT © 2026 uixmat) · registry:
// https://ui.bklit.com/r/gauge-chart.json · docs: https://bklit.com/docs
// Bklit gauge-chart is a notch-based radial gauge (visx responsive/pattern,
// d3-shape, motion) with center label. This port keeps the radial arc,
// tick notches, gradient sweep #D86D3E .35→0, glass center readout, 1.2s
// sweep, reduced-motion off-switch — pure SVG + motion, no new peer dep.
// Props: { value, max=100, label, size=160, title, measure, period, summary,
// emptyText, loading, className }. value==null renders the empty state.
import { memo, useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const ROYAL = '#D86D3E';
const OK = '#25D890';
const WARN = '#FFBD4A';
const BAD = '#FF5964';

export const GaugeChart = memo(function GaugeChart({
  value = null,
  max = 100,
  label,
  size = 160,
  title,
  measure,
  period,
  summary,
  emptyText = 'No gauge reading yet.',
  loading = false,
  className
}) {
  const reduced = useReducedMotion();
  const gid = useId();
  const empty = value == null || Number.isNaN(Number(value));

  const pct = empty ? 0 : Math.max(0, Math.min(1, Number(value) / (max || 1)));
  // 240° sweep from 150° to 30° (gap at bottom).
  const polar = (t, r) => {
    const a = ((150 - 240 * t) * Math.PI) / 180;
    return [80 + r * Math.cos(a), 74 + r * Math.sin(a)];
  };
  const arc = (t0, t1, r) => {
    const [x0, y0] = polar(t0, r);
    const [x1, y1] = polar(t1, r);
    return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${t1 - t0 > 0.5 ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
  };
  const color = pct >= 0.85 ? OK : pct >= 0.6 ? ROYAL : pct >= 0.35 ? WARN : BAD;

  const autoSummary =
    summary ||
    (empty ? 'No gauge reading yet.' : `${label || 'Gauge'} at ${Math.round(pct * 100)} percent of ${max}.`);

  return (
    <figure className={className} role="img" aria-label={`${title ? `${title}. ` : ''}Gauge. ${autoSummary}`}>
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
      ) : empty ? (
        <div className="grid place-items-center text-sm text-[var(--cf-ink-mute)]" style={{ height: size }}>{emptyText}</div>
      ) : (
        <svg width={size} height={size * 0.78} viewBox="0 0 160 125" aria-hidden>
          <defs>
            <linearGradient id={`${gid}-sweep`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
          </defs>
          {Array.from({ length: 25 }, (_, i) => {
            const t = i / 24;
            const [x0, y0] = polar(t, 62);
            const [x1, y1] = polar(t, 68);
            return (
              <line key={i} x1={x0} y1={y0} x2={x1} y2={y1}
                stroke="var(--cf-line)" strokeOpacity={0.45} strokeDasharray={i % 2 ? undefined : '1 2'} strokeWidth={1.5} />
            );
          })}
          <path d={arc(0, 1, 52)} fill="none" stroke="var(--cf-line)" strokeOpacity={0.6} strokeWidth={12} strokeLinecap="round" />
          <motion.path
            d={arc(0, Math.max(0.001, pct), 52)}
            fill="none"
            stroke={`url(#${gid}-sweep)`}
            strokeWidth={12}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: reduced ? 0 : 1.2, ease: [0.85, 0, 0.15, 1] }}
          />
          <text x="80" y="72" textAnchor="middle" fontSize="24" fontWeight="800" className="fill-[var(--cf-ink)] tabular-nums">
            {Math.round(pct * 100)}%
          </text>
          <text x="80" y="88" textAnchor="middle" fontSize="9" className="fill-[var(--cf-ink-mute)]">
            {(label || 'of ' + max).slice(0, 28)}
          </text>
        </svg>
      )}
      <figcaption className="sr-only">{autoSummary}</figcaption>
    </figure>
  );
});

export default GaugeChart;
