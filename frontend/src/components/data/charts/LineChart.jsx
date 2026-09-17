// LineChart — Bklit line-chart adaptation (JSX port, dependency-free).
// Source: https://github.com/bklit/bklit-ui (MIT © 2026 uixmat) · registry:
// https://ui.bklit.com/r/line-chart.json · docs: https://bklit.com/docs
// Bklit line-chart is the stroke-only sibling of area-chart (visx
// curve/shape + motion). Same API/chrome as ./AreaChart with fills off.
// Props mirror AreaChart: { data, xKey, series, height, title, measure,
// period, summary, emptyText, loading, className }.
import { memo } from 'react';
import { AreaChart } from './AreaChart';

export const LineChart = memo(function LineChart(props) {
  return <AreaChart {...props} filled={false} />;
});

export default LineChart;
