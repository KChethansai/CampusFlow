// AreaChart — Bklit area-chart adaptation (JSX port, dependency-free).
// Source: https://github.com/bklit/bklit-ui (MIT © 2026 uixmat) · registry:
// https://ui.bklit.com/r/area-chart.json · docs: https://bklit.com/docs
// Bklit composes <AreaChart data xDataKey><Grid horizontal/><Area dataKey
// fill fillOpacity strokeWidth gradientToOpacity/><XAxis/><ChartTooltip/> over
// visx shape/curve + motion ParentSize. This port keeps that API shape and the
// Stitch surface (horizontal-only dashed low-opacity gridlines, gradient fills
// #2563FF .35→0, glass tooltip, 1.2s clip-reveal, reduced-motion off-switch)
// with pure SVG + motion (already installed) so no new peer dep is required.
// Props: { data, xKey, series:[{key,color,dashed?,label?}], height, title,
// measure, period, summary, emptyText, loading, filled, className }.
import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

// ponytail: fixed 3-stop set, royal first — all three read on paper and coal-dark.
const DEFAULT_COLORS = ['#2563FF', '#8B5CF6', '#25D890'];
const PAD = { top: 10, right: 10, bottom: 24, left: 38 };

function useChartWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

// Catmull-Rom → bezier smoothing (visx curveMonotoneX look, no d3 needed).
function smoothPath(pts) {
  if (pts.length < 3) return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export const AreaChart = memo(function AreaChart({
  data = [],
  xKey = 'label',
  series = [{ key: 'value', color: '#2563FF' }],
  height = 260,
  title,
  measure,
  period,
  summary,
  emptyText = 'Not enough data for a trend yet.',
  loading = false,
  filled = true,
  className
}) {
  const reduced = useReducedMotion();
  const wrapRef = useRef(null);
  const width = useChartWidth(wrapRef);
  const clipId = useId();
  const [hover, setHover] = useState(null);

  const geom = useMemo(() => {
    if (!width || !data.length) return null;
    const keys = series.map((s) => s.key);
    const vals = data.flatMap((r) => keys.map((k) => Number(r[k]) || 0));
    const max = Math.max(...vals, 1);
    const min = Math.min(0, ...vals);
    const span = max - min || 1;
    const iw = width - PAD.left - PAD.right;
    const ih = height - PAD.top - PAD.bottom;
    const x = (i) => PAD.left + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const y = (v) => PAD.top + ih - ((v - min) / span) * ih;
    const lines = keys.map((k) => {
      const pts = data.map((r, i) => [x(i), y(Number(r[k]) || 0)]);
      const stroke = smoothPath(pts);
      const base = y(0);
      return { stroke, area: `${stroke}L${pts[pts.length - 1][0]},${base}L${pts[0][0]},${base}Z`, pts };
    });
    const ticks = [0, 0.5, 1].map((t) => ({ v: min + span * t, y: y(min + span * t) }));
    return { lines, ticks, iw, ih, x, max };
  }, [width, data, series, height]);

  const autoSummary =
    summary ||
    (data.length
      ? `${series.length} series across ${data.length} points. Latest ${String(xKey)}: ${String(data[data.length - 1]?.[xKey] ?? '—')}.`
      : 'No trend data yet.');

  const showEmpty = !loading && data.length === 0;

  const onMove = (e) => {
    if (!geom || data.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    const idx = Math.round((px / geom.iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  return (
    <figure className={className} role="img" aria-label={`${title ? `${title}. ` : ''}Trend chart. ${autoSummary}`}>
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
      <div ref={wrapRef} style={{ width: '100%', height }} aria-hidden={geom ? undefined : true}>
        {loading || !geom ? (
          <div className="grid place-items-center h-full text-sm text-[var(--cf-ink-mute)]">
            {showEmpty ? emptyText : 'Loading chart…'}
          </div>
        ) : (
          <div
            className="relative w-full h-full"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            <svg width={width} height={height} className="overflow-visible block">
              <defs>
                {series.map((s, i) => {
                  const c = s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                  return (
                    <linearGradient key={s.key} id={`${clipId}-g${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  );
                })}
                <clipPath id={clipId}>
                  <motion.rect
                    x={0}
                    y={0}
                    height={height}
                    initial={{ width: 0 }}
                    animate={{ width }}
                    transition={{ duration: reduced ? 0 : 1.2, ease: [0.85, 0, 0.15, 1] }}
                  />
                </clipPath>
              </defs>
              {geom.ticks.map((t, i) => (
                <g key={i}>
                  <line x1={PAD.left} x2={width - PAD.right} y1={t.y} y2={t.y}
                    stroke="var(--cf-line)" strokeOpacity={0.45} strokeDasharray="4 6" />
                  <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fontSize={11} fill="var(--cf-ink-mute)" className="tabular-nums">
                    {Math.round(t.v * 10) / 10}
                  </text>
                </g>
              ))}
              <g clipPath={`url(#${clipId})`}>
                {geom.lines.map((line, i) => {
                  const s = series[i];
                  const c = s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                  return (
                    <g key={s.key}>
                      {filled && !s.dashed && (
                        <path d={line.area} fill={`url(#${clipId}-g${i})`} />
                      )}
                      <path
                        d={line.stroke}
                        fill="none"
                        stroke={c}
                        strokeWidth={2}
                        strokeDasharray={s.dashed ? '6 4' : undefined}
                        strokeLinecap="round"
                      />
                    </g>
                  );
                })}
              </g>
              {data.map((r, i) => {
                const xi = geom.x(i);
                if (i % Math.ceil(data.length / 6) !== 0 && i !== data.length - 1) return null;
                return (
                  <text key={i} x={xi} y={height - 6} textAnchor="middle" fontSize={11} fill="var(--cf-ink-mute)">
                    {String(r[xKey] ?? '').slice(0, 12)}
                  </text>
                );
              })}
              {hover != null && (
                <g>
                  <line x1={geom.x(hover)} x2={geom.x(hover)} y1={PAD.top} y2={height - PAD.bottom}
                    stroke="var(--cf-line)" strokeDasharray="4 4" />
                  {geom.lines.map((line, i) => {
                    const s = series[i];
                    const c = s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                    return (
                      <circle key={s.key} cx={line.pts[hover][0]} cy={line.pts[hover][1]} r={4}
                        fill={c} stroke="var(--cf-surface)" strokeWidth={2} />
                    );
                  })}
                </g>
              )}
            </svg>
            {hover != null && (
              <div
                className="cf-glass pointer-events-none absolute z-10 rounded-[12px] border border-[var(--cf-line)] px-2.5 py-1.5 text-xs shadow-lg"
                style={{
                  left: `min(max(${geom.x(hover)}px, 70px), ${width - 70}px)`,
                  top: 0,
                  transform: 'translateX(-50%)'
                }}
              >
                <p className="font-semibold text-[var(--cf-ink)]">{String(data[hover][xKey] ?? '')}</p>
                {series.map((s, i) => {
                  const c = s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                  return (
                    <p key={s.key} className="tabular-nums text-[var(--cf-ink-mute)]">
                      <span aria-hidden style={{ color: c }}>● </span>
                      {s.label || s.key}: <span className="font-semibold text-[var(--cf-ink)]">{String(data[hover][s.key] ?? '—')}</span>
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <figcaption className="sr-only">{autoSummary}</figcaption>
      <table className="sr-only">
        <caption>{title || 'Trend data'}</caption>
        <thead>
          <tr>
            <th scope="col">{xKey}</th>
            {series.map((s) => (
              <th key={s.key} scope="col">{s.label || s.key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <th scope="row">{String(row[xKey] ?? '')}</th>
              {series.map((s) => (
                <td key={s.key}>{String(row[s.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
});

export default AreaChart;
