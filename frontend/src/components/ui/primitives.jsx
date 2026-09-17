// CampusFlow UI primitives — every external pattern is normalized here.
// Typography / spacing / radius / motion always come from system/tokens.
import { forwardRef, useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  badge as badgeFn,
  btnClass,
  cardClass,
  cn,
  emptyState,
  inputClass,
  labelClass,
  pageHeading,
  pageSubheading,
  roleBadge as roleBadgeFn,
  statusBadge as statusBadgeFn
} from '../../system/tokens';

export { cn, statusBadgeFn as statusBadge, roleBadgeFn as roleBadge };

export function Button({ variant = 'primary', size = 'medium', className, ...props }) {
  return <button className={cn(btnClass(variant, size), className)} {...props} />;
}

// Glass fields: hairline borders + 14px radius + royal focus ring.
const glassField =
  'border border-[var(--cf-line)] rounded-[14px] focus:border-[#2563FF] focus:ring-[3px] focus:ring-[#2563FF]/30 focus:outline-none';
const glassError = 'border-[#FF5964] focus:border-[#FF5964] focus:ring-[#FF5964]/30';

const FieldShell = ({ label, error, id, children }) => (
  <div>
    {label && (
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
    )}
    {children}
    {error && (
      <p className="mt-1 text-xs font-medium text-[#FF5964]" role="alert">
        {error}
      </p>
    )}
  </div>
);

export const Input = forwardRef(function Input({ label, error, id, className, ...props }, ref) {
  return (
    <FieldShell label={label} error={error} id={id}>
      <input
        id={id}
        ref={ref}
        className={cn(inputClass, glassField, error && glassError, className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldShell>
  );
});

export const Select = forwardRef(function Select({ label, error, id, className, children, ...props }, ref) {
  return (
    <FieldShell label={label} error={error} id={id}>
      <select id={id} ref={ref} className={cn(inputClass, glassField, error && glassError, className)} {...props}>
        {children}
      </select>
    </FieldShell>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, id, className, ...props }, ref) {
  return (
    <FieldShell label={label} error={error} id={id}>
      <textarea
        id={id}
        ref={ref}
        rows={4}
        className={cn(inputClass, glassField, error && glassError, className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldShell>
  );
});

// Glass pills — single status language.
const pillGlass =
  'status-pill font-medium rounded-full px-2.5 py-0.5 border border-[var(--cf-line)] text-xs whitespace-nowrap';

export function Badge({ tone, status, role, className, children }) {
  if (status)
    return <span className={cn(statusBadgeFn(status), pillGlass, className)}>{children ?? status.replace(/_/g, ' ')}</span>;
  if (role)
    return <span className={cn(roleBadgeFn(role), pillGlass, className)}>{children ?? role.replace(/_/g, ' ')}</span>;
  return <span className={cn(badgeFn(tone), pillGlass, className)}>{children}</span>;
}

export function StatusPill({ status, className, children }) {
  return (
    <span className={cn(statusBadgeFn(status), pillGlass, className)}>
      {children ?? String(status || '').replace(/_/g, ' ')}
    </span>
  );
}

export function RoleBadge({ role, className, children }) {
  return (
    <span className={cn(roleBadgeFn(role), pillGlass, className)}>
      {children ?? String(role || '').replace(/_/g, ' ')}
    </span>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <section className={cn(cardClass, 'glass-card cf-card-spot p-5', className)} {...props}>
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, kicker, number, breadcrumbs }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="min-w-0">
        {(kicker || number) && (
          <p className="cf-kicker mb-1.5 flex items-center gap-2">
            {number && (
              <span className="inline-flex items-center justify-center min-w-7 px-1.5 py-0.5 bg-[#A7D700] text-[#0A0D12] border border-[var(--cf-line)] rounded-md font-mono text-[11px] font-bold">
                {number}
              </span>
            )}
            {kicker}
          </p>
        )}
        <h1 className={pageHeading}>{title}</h1>
        {subtitle && <p className={pageSubheading}>{subtitle}</p>}
        {breadcrumbs && (
          <nav aria-label="Breadcrumb" className="mt-1.5 text-xs text-[var(--cf-ink-mute)]">
            {breadcrumbs}
          </nav>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', hint, action, editorial }) {
  return (
    <div className={emptyState}>
      {editorial ? (
        <p className="font-display font-semibold tracking-tight text-3xl text-[var(--cf-ink-soft)]">{title}</p>
      ) : (
        <p className="font-medium text-[var(--cf-ink-soft)]">{title}</p>
      )}
      {hint && <p className="mt-1 text-sm">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="py-10 space-y-3" role="status" aria-live="polite" aria-label={label}>
      <div className="cf-shimmer h-4 rounded-lg bg-black/[.06] dark:bg-white/10 w-2/3" aria-hidden />
      <div className="cf-shimmer h-4 rounded-lg bg-black/[.06] dark:bg-white/10 w-full" aria-hidden style={{ animationDelay: '.2s' }} />
      <div className="cf-shimmer h-4 rounded-lg bg-black/[.06] dark:bg-white/10 w-1/2" aria-hidden style={{ animationDelay: '.4s' }} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="text-center py-10">
      <p className="text-sm font-medium text-[#FF5964]">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className={btnClass('outline', 'small') + ' mt-3'}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-black/[.06] dark:bg-white/10', className)} />;
}

export function Stat({ label, value, sub }) {
  const numeric = typeof value === 'number';
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--cf-ink-mute)]">{label}</p>
      <p className="text-2xl font-bold tracking-tight tabular-nums text-[var(--cf-ink)] mt-0.5">
        {numeric ? <AnimatedNumber value={value} /> : value}
      </p>
      {sub && <p className="text-xs text-[var(--cf-ink-mute)] mt-0.5">{sub}</p>}
    </div>
  );
}

export function AnimatedNumber({ value }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) { setDisplay(value); return; }
    let raf; const start = performance.now(); const dur = 900;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplay(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);
  return <>{Math.round(display)}</>;
}
