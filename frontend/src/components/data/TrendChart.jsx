// TrendChart: thin wrapper over ./charts/AreaChart (Bklit area-chart port).
// Props API unchanged: { data, xKey, lines, height, summary, className }.
// Callers keep their React.lazy call sites; this module lazy-loads the chart
// engine internally (same pattern as before, recharts-free). Zero harsh
// gridlines, gradient fills #D86D3E .35→0, 1.2s draw, glass tooltip.
import { Suspense } from 'react';
import { ChunkErrorBoundary, lazyRetry } from './LazyRetry';

const AreaChart = lazyRetry(() => import('./charts/AreaChart'));

// ponytail: fixed 3-stop set, royal first — all three read on paper and coal-dark.
const DEFAULT_COLORS = ['#D86D3E', '#A77B68', '#25D890'];

export function TrendChart({
  data = [],
  xKey = 'label',
  lines = [{ key: 'value', color: '#D86D3E' }],
  height = 260,
  summary,
  className
}) {
  const series = lines.map((line, i) => ({
    key: line.key,
    label: line.label || line.key,
    color: line.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    dashed: line.dashed
  }));
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center text-sm text-[var(--cf-ink-mute)]" style={{ height }}>
          {data.length === 0 ? 'Not enough data for a trend yet.' : 'Loading chart…'}
        </div>
      }
    >
      <ChunkErrorBoundary>
        <AreaChart
          data={data}
          xKey={xKey}
          series={series}
          height={height}
          summary={summary}
          className={className}
        />
      </ChunkErrorBoundary>
    </Suspense>
  );
}

export default TrendChart;
