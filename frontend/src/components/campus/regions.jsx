// Campus domain widgets — REGION shells shared by every dashboard + page.
// Thin wrappers over ui/ primitives (Card language, AnimatedCounter,
// SpotCard, EmptyState/LoadingState) + Motion. No endpoints, no store,
// no stage logic here. Role accents stay subtle: a faint hero glow only.
import { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Info } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../system/tokens';
import { AnimatedCounter, SpotCard } from '../ui/editorial';
import { EmptyState, LoadingState } from '../ui/primitives';

export const HERO =
  'cf-glass rounded-[24px] border border-[var(--cf-line)] p-6 sm:p-8 relative overflow-hidden';
export const PANEL = 'cf-glass rounded-[24px] border border-[var(--cf-line)] p-5';

// ponytail: one glow per role, hero-only. Admin is deliberately fainter + dense.
export const ROLE_ACCENTS = {
  student: { glow: 'bg-gradient-to-r from-[#2563FF]/15 to-[#8B5CF6]/15', dot: '#8B5CF6' },
  faculty: { glow: 'bg-gradient-to-r from-[#2563FF]/15 to-[#22d3ee]/15', dot: '#22d3ee' },
  placement: { glow: 'bg-gradient-to-r from-[#8B5CF6]/15 to-[#2563FF]/15', dot: '#8B5CF6' },
  admin: { glow: 'bg-gradient-to-r from-[#2563FF]/[.07] to-black/[.04] dark:to-white/[.04]', dot: '#2563FF' }
};

/** Hero Pulse KPI: NumberTicker macro-metric + ring/gauge slot + role accent. */
export const RoleHero = memo(function RoleHero({
  accent = 'student',
  kicker,
  title,
  metric,
  sub,
  alert,
  gauge,
  dense,
  label,
  children
}) {
  const a = ROLE_ACCENTS[accent] || ROLE_ACCENTS.student;
  return (
    <section aria-label={label || kicker} className={cn(HERO, dense && '!p-5 sm:!p-6')}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={cn('absolute -top-28 left-1/3 h-64 w-[520px] rounded-full blur-[100px]', a.glow)} />
      </div>
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1 basis-64">
          {kicker && (
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: a.dot }} aria-hidden />
              {kicker}
            </p>
          )}
          {title && (
            <h1 className={cn('mt-2 font-bold tracking-tight', dense ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl')}>
              {title}
            </h1>
          )}
          {metric != null && (
            <p className={cn('mt-2 font-bold tabular-nums tracking-tight', dense ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl')}>
              {typeof metric === 'number' ? <AnimatedCounter value={metric} /> : metric}
            </p>
          )}
          {sub && <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">{sub}</p>}
          {alert}
        </div>
        {gauge}
      </div>
      {children && <div className="relative mt-6">{children}</div>}
    </section>
  );
});

/** Analytics panel: titled + real question + period + tooltip + summary + empty/loading. */
export const AnalyticsPanel = memo(function AnalyticsPanel({
  title,
  icon,
  question,
  period,
  tooltip,
  summary,
  loading,
  empty,
  emptyHint,
  action,
  children,
  className,
  label
}) {
  return (
    <section aria-label={label || title} className={cn(PANEL, className)}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 className="font-display text-base font-semibold flex items-center gap-2 min-w-0">
          {icon}
          <span className="truncate">{title}</span>
          {tooltip && (
            <span title={tooltip} aria-label={tooltip} className="shrink-0 text-[var(--cf-ink-mute)]">
              <Info size={13} aria-hidden />
            </span>
          )}
        </h2>
        {action}
      </div>
      {(question || period) && (
        <p className="text-xs text-[var(--cf-ink-mute)] mb-3">
          {question}
          {question && period ? ' · ' : ''}
          {period}
        </p>
      )}
      {loading ? (
        <LoadingState label={`Loading ${title}…`} />
      ) : empty ? (
        <EmptyState title={empty} hint={emptyHint} />
      ) : (
        children
      )}
      {summary && !loading && !empty && (
        <p className="mt-3 text-xs text-[var(--cf-ink-mute)] border-t border-[var(--cf-line)] pt-2.5">{summary}</p>
      )}
    </section>
  );
});

/** Activity stream: Magic-style animated list with Motion layout. */
export function ActivityStream({ items = [], renderItem, empty, label }) {
  const reduced = useReducedMotion();
  if (!items.length) return empty ?? null;
  return (
    <motion.ul
      layout={!reduced}
      initial={false}
      aria-label={label}
      className="divide-y divide-[var(--cf-line)]"
    >
      <AnimatePresence initial={false} popLayout>
        {items.map((item) => (
          <motion.li
            key={item._id || item.key}
            layout={!reduced}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            transition={{ duration: 0.22 }}
          >
            {renderItem(item)}
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}

/** Task cards: spotlight hover-lift grid. */
export function TaskGrid({ children, className }) {
  return <div className={cn('grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4', className)}>{children}</div>;
}

const TASK =
  'cf-card-spot rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface)] p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg block w-full text-left';

export function SpotTask({ to, onClick, label, children, className }) {
  const cls = cn(TASK, className);
  if (to) {
    return (
      <Link to={to} className={cls} aria-label={label}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={label}>
      {children}
    </button>
  );
}

export function TaskStat({ label, value, sub }) {
  return (
    <span className="block">
      <span className="block text-xs font-medium uppercase tracking-wide text-[var(--cf-ink-mute)]">{label}</span>
      <span className="block text-3xl font-bold tabular-nums mt-0.5">
        {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
      </span>
      {sub && <span className="block text-[11px] text-[var(--cf-ink-mute)] mt-0.5">{sub}</span>}
    </span>
  );
}

// --- Lazy recharts viz: Area / Bar / Composed over one glass-tooltip language.
// ponytail: one loader + one style instead of three chart components.
const CHART_COLORS = ['#2563FF', '#8B5CF6', '#25D890'];

export function LazyChart({
  kind = 'area',
  data = [],
  xKey = 'label',
  series = [{ key: 'value' }],
  height = 200,
  summary
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
      ? `${series.length} series across ${data.length} points. Latest ${String(xKey)}: ${String(data[data.length - 1]?.[xKey] ?? '—')}.`
      : 'No chart data yet.');

  const tooltipStyle = {
    background: 'color-mix(in srgb, var(--cf-surface) 82%, transparent)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--cf-line)',
    borderRadius: 14,
    fontSize: 12,
    boxShadow: '0 12px 32px -8px rgba(16,24,40,.25)'
  };

  return (
    <figure role="img" aria-label={`Chart. ${autoSummary}`}>
      <div style={{ width: '100%', height }} aria-hidden>
        {!charts || data.length === 0 ? (
          <div className="grid place-items-center h-full text-sm text-[var(--cf-ink-mute)]">
            {data.length === 0 ? 'Not enough data for a chart yet.' : 'Loading chart…'}
          </div>
        ) : (
          <charts.ResponsiveContainer width="100%" height="100%">
            {kind === 'bar' ? (
              <charts.BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <charts.CartesianGrid vertical={false} stroke="var(--cf-line)" strokeOpacity={0.45} strokeDasharray="4 6" />
                <charts.XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'var(--cf-ink-mute)' }} tickLine={false} axisLine={{ stroke: 'var(--cf-line)' }} />
                <charts.YAxis tick={{ fontSize: 11, fill: 'var(--cf-ink-mute)' }} tickLine={false} axisLine={false} width={40} />
                <charts.Tooltip cursor={{ fill: 'var(--cf-line)', opacity: 0.25 }} contentStyle={tooltipStyle} />
                {series.map((s, i) => (
                  <charts.Bar
                    key={s.key}
                    dataKey={s.key}
                    fill={s.color || CHART_COLORS[i % CHART_COLORS.length]}
                    radius={[7, 7, 0, 0]}
                    isAnimationActive={!reduced}
                    animationDuration={900}
                  />
                ))}
              </charts.BarChart>
            ) : kind === 'composed' ? (
              <charts.ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <defs>
                  {series.filter((s) => (s.type || 'area') === 'area').map((s, i) => (
                    <linearGradient key={s.key} id={`cf-mix-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color || CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={s.color || CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <charts.CartesianGrid vertical={false} stroke="var(--cf-line)" strokeOpacity={0.45} strokeDasharray="4 6" />
                <charts.XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'var(--cf-ink-mute)' }} tickLine={false} axisLine={{ stroke: 'var(--cf-line)' }} />
                <charts.YAxis tick={{ fontSize: 11, fill: 'var(--cf-ink-mute)' }} tickLine={false} axisLine={false} width={40} />
                <charts.Tooltip cursor={{ stroke: 'var(--cf-line)', strokeDasharray: '4 4' }} contentStyle={tooltipStyle} />
                {series.map((s, i) => {
                  const c = s.color || CHART_COLORS[i % CHART_COLORS.length];
                  if ((s.type || 'area') === 'bar') {
                    return <charts.Bar key={s.key} dataKey={s.key} fill={c} radius={[7, 7, 0, 0]} isAnimationActive={!reduced} animationDuration={900} />;
                  }
                  return (
                    <charts.Area
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      stroke={c}
                      strokeWidth={2}
                      fill={`url(#cf-mix-${series.filter((x) => (x.type || 'area') === 'area').indexOf(s)})`}
                      dot={false}
                      activeDot={{ r: 4, fill: c, stroke: 'var(--cf-surface)', strokeWidth: 2 }}
                      isAnimationActive={!reduced}
                      animationDuration={1200}
                    />
                  );
                })}
              </charts.ComposedChart>
            ) : (
              <charts.AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <defs>
                  {series.map((s, i) => {
                    const c = s.color || CHART_COLORS[i % CHART_COLORS.length];
                    return (
                      <linearGradient key={s.key} id={`cf-lazy-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <charts.CartesianGrid vertical={false} stroke="var(--cf-line)" strokeOpacity={0.45} strokeDasharray="4 6" />
                <charts.XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'var(--cf-ink-mute)' }} tickLine={false} axisLine={{ stroke: 'var(--cf-line)' }} />
                <charts.YAxis tick={{ fontSize: 11, fill: 'var(--cf-ink-mute)' }} tickLine={false} axisLine={false} width={40} />
                <charts.Tooltip cursor={{ stroke: 'var(--cf-line)', strokeDasharray: '4 4' }} contentStyle={tooltipStyle} />
                {series.map((s, i) => {
                  const c = s.color || CHART_COLORS[i % CHART_COLORS.length];
                  return (
                    <charts.Area
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      stroke={c}
                      strokeWidth={2}
                      strokeDasharray={s.dashed ? '6 4' : undefined}
                      fill={s.dashed ? 'none' : `url(#cf-lazy-${i})`}
                      dot={false}
                      activeDot={{ r: 4, fill: c, stroke: 'var(--cf-surface)', strokeWidth: 2 }}
                      isAnimationActive={!reduced}
                      animationDuration={1200}
                    />
                  );
                })}
              </charts.AreaChart>
            )}
          </charts.ResponsiveContainer>
        )}
      </div>
      <figcaption className="sr-only">{autoSummary}</figcaption>
      <table className="sr-only">
        <caption>Chart data</caption>
        <thead>
          <tr>
            <th scope="col">{xKey}</th>
            {series.map((s) => (
              <th key={s.key} scope="col">{s.key}</th>
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
}

/** SmoothUI-style local tabs: sliding active pill via layoutId. */
export function PillTabs({ tabs = [], active, onChange, label, id = 'cf-tabs' }) {
  const reduced = useReducedMotion();
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={label}>
      {tabs.map((t) => {
        const selected = active === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.key)}
            style={selected && reduced ? { background: '#2563FF' } : undefined}
            className={cn(
              'relative rounded-full px-4 py-2 text-xs font-bold border transition isolate',
              selected
                ? 'text-white border-transparent'
                : 'bg-[var(--cf-surface)] text-[var(--cf-ink-soft)] border-[var(--cf-line)] hover:border-[#2563FF]/50'
            )}
          >
            {!reduced && selected && (
              <motion.span
                layoutId={id}
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ background: '#2563FF', zIndex: -1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-[1]">
              {t.label}
              {t.count != null && <span className="ml-1.5 tabular-nums opacity-80">{t.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { SpotCard };
