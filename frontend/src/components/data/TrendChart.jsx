// TrendChart: lazy-safe recharts v3 AreaChart wrapper (Stitch analytics surface).
// Props API unchanged: { data, xKey, lines, height, summary, className }.
// Zero harsh gridlines (horizontal-only, dashed, low-opacity), gradient fills
// #2563FF .35→0, 1.2s draw, glass tooltip, ticks in --cf-ink-mute.
// Reduced-motion disables animation. Always ships a data table + summary.
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

// ponytail: fixed 3-stop set, royal first — all three read on paper and coal-dark.
const DEFAULT_COLORS = ['#2563FF', '#8B5CF6', '#25D890'];

export function TrendChart({
  data = [],
  xKey = 'label',
  lines = [{ key: 'value', color: '#2563FF' }],
  height = 260,
  summary,
  className
}) {
  const reduced = useReducedMotion();
  const [charts, setCharts] = useState(null);

  useEffect(() => {
    let live = true;
    import('recharts').then((m) => {
      if (live) setCharts(m);
    });
    return () => {
      live = false;
    };
  }, []);

  const autoSummary =
    summary ||
    (data.length
      ? `${lines.length} series across ${data.length} points. Latest ${String(xKey)}: ${String(data[data.length - 1]?.[xKey] ?? '—')}.`
      : 'No trend data yet.');

  return (
    <figure className={className} role="img" aria-label={`Trend chart. ${autoSummary}`}>
      <div style={{ width: '100%', height }} aria-hidden>
        {!charts || data.length === 0 ? (
          <div className="grid place-items-center h-full text-sm text-[var(--cf-ink-mute)]">
            {data.length === 0 ? 'Not enough data for a trend yet.' : 'Loading chart…'}
          </div>
        ) : (
          <charts.ResponsiveContainer width="100%" height="100%">
            <charts.AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <defs>
                {lines.map((line, i) => {
                  const c = line.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                  return (
                    <linearGradient key={line.key} id={`cf-area-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  );
                })}
              </defs>
              <charts.CartesianGrid
                vertical={false}
                stroke="var(--cf-line)"
                strokeOpacity={0.45}
                strokeDasharray="4 6"
              />
              <charts.XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: 'var(--cf-ink-mute)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--cf-line)' }}
              />
              <charts.YAxis
                tick={{ fontSize: 11, fill: 'var(--cf-ink-mute)' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <charts.Tooltip
                cursor={{ stroke: 'var(--cf-line)', strokeDasharray: '4 4' }}
                contentStyle={{
                  background: 'color-mix(in srgb, var(--cf-surface) 82%, transparent)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid var(--cf-line)',
                  borderRadius: 14,
                  fontSize: 12,
                  boxShadow: '0 12px 32px -8px rgba(16,24,40,.25)'
                }}
              />
              {lines.map((line, i) => {
                const c = line.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                return (
                  <charts.Area
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    stroke={c}
                    strokeWidth={2}
                    strokeDasharray={line.dashed ? '6 4' : undefined}
                    fill={line.dashed ? 'none' : `url(#cf-area-${i})`}
                    dot={false}
                    activeDot={{ r: 4, fill: c, stroke: 'var(--cf-surface)', strokeWidth: 2 }}
                    isAnimationActive={!reduced}
                    animationDuration={1200}
                  />
                );
              })}
            </charts.AreaChart>
          </charts.ResponsiveContainer>
        )}
      </div>
      <figcaption className="sr-only">{autoSummary}</figcaption>
      <table className="sr-only">
        <caption>Trend data</caption>
        <thead>
          <tr>
            <th scope="col">{xKey}</th>
            {lines.map((l) => (
              <th key={l.key} scope="col">{l.key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <th scope="row">{String(row[xKey] ?? '')}</th>
              {lines.map((l) => (
                <td key={l.key}>{String(row[l.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
