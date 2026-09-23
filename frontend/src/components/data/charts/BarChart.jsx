// BarChart — Bklit bar-chart adaptation (JSX port, dependency-free).
// Source: https://github.com/bklit/bklit-ui (MIT © 2026 uixmat) · registry:
// https://ui.bklit.com/r/bar-chart.json · docs: https://bklit.com/docs
// Bklit bar-chart layers visx gradient/pattern/shape bars with motion enter
// transitions. This port keeps grouped rounded bars, gradient fills .35→0,
// dashed low-opacity markers, glass tooltip, 1.2s grow, reduced-motion off.
// Props: { data, xKey, series:[{key,color,label?}], height, title, measure,
// period, summary, emptyText, loading, className }.
import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const DEFAULT_COLORS = ['#D86D3E', '#A77B68', '#25D890'];
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

export const BarChart = memo(function BarChart({
  data = [],
  xKey = 'label',
  series = [{ key: 'value', color: '#D86D3E' }],
  height = 260,
  title,
  measure,
  period,
  summary,
  emptyText = 'No values to chart yet.',
  loading = false,
  className
}) {
  const reduced = useReducedMotion();
  const wrapRef = useRef(null);
  const width = useChartWidth(wrapRef);
  const gid = useId();
  const [hover, setHover] = useState(null);

  const geom = useMemo(() => {
    if (!width || !data.length) return null;
    const keys = series.map((s) => s.key);
    const vals = data.flatMap((r) => keys.map((k) => Number(r[k]) || 0));
    const max = Math.max(...vals, 1);
    const iw = width - PAD.left - PAD.right;
    const ih = height - PAD.top - PAD.bottom;
    const slot = iw / data.length;
    const bw = Math.min(28, (slot * 0.52) / keys.length);
    const y = (v) => PAD.top + ih - (v / max) * ih;
    const ticks = [0, 0.5, 1].map((t) => ({ v: max * t, y: y(max * t) }));
    return { keys, max, iw, ih, slot, bw, y, ticks };
  }, [width, data, series, height]);

  const autoSummary =
    summary ||
    (data.length
      ? `${series.length} series across ${data.length} groups. Peak ${series[0]?.key}: ${geom?.max ?? '—'}.`
      : 'No bar data yet.');

  const showEmpty = !loading && data.length === 0;

  const onMove = (e) => {
    if (!geom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const idx = Math.floor((e.clientX - rect.left - PAD.left) / geom.slot);
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  return (
    <figure className={className} role="img" aria-label={`${title ? `${title}. ` : ''}Bar chart. ${autoSummary}`}>
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
          <div className="relative w-full h-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
            <svg width={width} height={height} className="block">
              <defs>
                {series.map((s, i) => {
                  const c = s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                  return (
                    <linearGradient key={s.key} id={`${gid}-b${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={c} stopOpacity={0.35} />
                    </linearGradient>
                  );
                })}
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
              {data.map((r, i) => {
                const cx = PAD.left + geom.slot * (i + 0.5);
                return (
                  <g key={i}>
                    {geom.keys.map((k, ki) => {
                      const s = series[ki];
                      const v = Number(r[k]) || 0;
                      const h = (v / geom.max) * geom.ih;
                      const x = cx - (geom.keys.length * geom.bw) / 2 + ki * geom.bw + 2;
                      const yTop = geom.y(v);
                      return (
                        <motion.rect
                          key={k}
                          x={x}
                          width={Math.max(2, geom.bw - 4)}
                          rx={4}
                          fill={`url(#${gid}-b${ki})`}
                          opacity={hover == null || hover === i ? 1 : 0.45}
                          initial={{ y: PAD.top + geom.ih, height: 0 }}
                          animate={{ y: yTop, height: Math.max(0, h) }}
                          transition={{ duration: reduced ? 0 : 1.2, ease: [0.85, 0, 0.15, 1], delay: reduced ? 0 : i * 0.03 }}
                        />
                      );
                    })}
                    {(i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) && (
                      <text x={cx} y={height - 6} textAnchor="middle" fontSize={11} fill="var(--cf-ink-mute)">
                        {String(r[xKey] ?? '').slice(0, 12)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            {hover != null && (
              <div
                className="cf-glass pointer-events-none absolute z-10 rounded-[12px] border border-[var(--cf-line)] px-2.5 py-1.5 text-xs shadow-lg"
                style={{
                  left: `min(max(${PAD.left + geom.slot * (hover + 0.5)}px, 70px), ${width - 70}px)`,
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
        <caption>{title || 'Bar data'}</caption>
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

export default BarChart;
