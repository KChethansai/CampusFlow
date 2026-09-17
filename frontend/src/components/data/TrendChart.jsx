// TrendChart: lazy-safe recharts v3 LineChart wrapper.
// Recharts loads on mount (code-split) so dashboards never pay for it upfront.
// Reduced-motion disables line/dot animation. Always ships a data table + summary.
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

// ponytail: fixed 3-color set, no per-theme JS — all three read on paper and coal-dark.
const DEFAULT_COLORS = ['#0055ff', '#8b5cf6', '#e63b2e'];

export function TrendChart({
  data = [],
  xKey = 'label',
  lines = [{ key: 'value', color: '#0055ff' }],
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
            <charts.LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <charts.CartesianGrid stroke="var(--cf-line)" strokeDasharray="3 3" />
              <charts.XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: 'var(--cf-ink-mute)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--cf-ink)' }}
              />
              <charts.YAxis
                tick={{ fontSize: 11, fill: 'var(--cf-ink-mute)' }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <charts.Tooltip
                contentStyle={{
                  background: 'var(--cf-surface)',
                  border: '2px solid var(--cf-ink)',
                  borderRadius: 10,
                  fontSize: 12
                }}
              />
              {lines.map((line, i) => (
                <charts.Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  stroke={line.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                  strokeWidth={2.5}
                  strokeDasharray={line.dashed ? '6 4' : undefined}
                  dot={false}
                   activeDot={{ r: 4, stroke: '#8b5cf6', strokeWidth: 2 }}
                  isAnimationActive={!reduced}
                />
              ))}
            </charts.LineChart>
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
