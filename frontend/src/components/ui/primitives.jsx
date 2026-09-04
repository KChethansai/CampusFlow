// CampusFlow UI primitives — every external pattern is normalized here.
// Typography / spacing / radius / motion always come from system/tokens.
import { forwardRef } from 'react';
import {
  badge as badgeFn,
  btnClass,
  cardClass,
  cn,
  emptyState,
  inputClass,
  labelClass,
  loadingState,
  pageHeading,
  pageSubheading,
  roleBadge as roleBadgeFn,
  statusBadge as statusBadgeFn
} from '../../system/tokens';

export { cn, statusBadgeFn as statusBadge, roleBadgeFn as roleBadge };

export function Button({ variant = 'primary', size = 'medium', className, ...props }) {
  return <button className={cn(btnClass(variant, size), className)} {...props} />;
}

export const Input = forwardRef(function Input({ label, error, id, className, ...props }, ref) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(inputClass, error && 'border-red-400 focus:ring-red-400 focus:border-red-400', className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export function Select({ label, error, id, className, children, ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <select id={id} className={cn(inputClass, className)} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, id, className, ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <textarea id={id} rows={4} className={cn(inputClass, className)} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Badge({ tone, status, role, className, children }) {
  if (status) return <span className={cn(statusBadgeFn(status), className)}>{children ?? status.replace(/_/g, ' ')}</span>;
  if (role) return <span className={cn(roleBadgeFn(role), className)}>{children ?? role.replace(/_/g, ' ')}</span>;
  return <span className={cn(badgeFn(tone), className)}>{children}</span>;
}

export function Card({ className, children, ...props }) {
  return (
    <section className={cn(cardClass, 'p-5', className)} {...props}>
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className={pageHeading}>{title}</h1>
        {subtitle && <p className={pageSubheading}>{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', hint, action }) {
  return (
    <div className={emptyState}>
      <p className="font-medium text-[var(--cf-ink-soft)]">{title}</p>
      {hint && <p className="mt-1 text-sm">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="py-10" role="status" aria-live="polite">
      <div className="flex items-center justify-center gap-2">
        <span className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" aria-hidden />
        <span className={loadingState}>{label}</span>
      </div>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="text-center py-10">
      <p className="text-sm font-medium text-red-600">{message}</p>
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
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--cf-ink-mute)]">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-[var(--cf-ink)] mt-0.5">{value}</p>
      {sub && <p className="text-xs text-[var(--cf-ink-mute)] mt-0.5">{sub}</p>}
    </div>
  );
}
