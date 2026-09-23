// CampusFlow UI primitives — every external pattern is normalized here.
// Typography / spacing / radius / motion always come from system/tokens.
import { forwardRef, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
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
import { useFocusTrap } from '../../system/focusTrap';

export { cn, statusBadgeFn as statusBadge, roleBadgeFn as roleBadge };

export function Button({ variant = 'primary', size = 'medium', className, ...props }) {
  return <button className={cn(btnClass(variant, size), className)} {...props} />;
}

// Glass fields: hairline borders + 14px radius + royal focus ring.
const glassField =
  'border border-[var(--cf-line)] rounded-[14px] focus:border-[#D86D3E] focus:ring-[3px] focus:ring-[#D86D3E]/30 focus:outline-none';
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
              <span className="inline-flex items-center justify-center min-w-7 px-1.5 py-0.5 bg-[#E7A66D] text-[#100D0B] border border-[var(--cf-line)] rounded-md font-mono text-[11px] font-bold">
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

export function GlowButton({ variant = 'primary', size = 'medium', className, children, ...props }) {
  return (
    <button
      className={cn(
        btnClass(variant, size),
        'relative group overflow-hidden transition-all duration-300',
        'hover:shadow-[0_0_24px_rgba(216,109,62,0.45)]',
        className
      )}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" aria-hidden />
    </button>
  );
}

export function Tabs({ tabs = [], value, onChange, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60 backdrop-blur-md',
        className
      )}
    >
      {tabs.map((tab) => {
        const id = typeof tab === 'string' ? tab : tab.id || tab.value;
        const label = typeof tab === 'string' ? tab : tab.label || tab.title;
        const active = value === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(id)}
            className={cn(
              'relative px-3.5 py-1.5 rounded-xl text-xs font-display font-semibold transition-colors duration-200 focus-visible:outline-[3px] focus-visible:outline-[#D86D3E]',
              active ? 'text-white' : 'text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)]'
            )}
          >
            {active && (
              <motion.span
                layoutId="cf-tabs-indicator"
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="absolute inset-0 rounded-xl bg-[#D86D3E] shadow-[0_2px_12px_rgba(216,109,62,0.45)]"
                aria-hidden
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Drawer({ open, onClose, title, children, wide, className }) {
  const reduced = useReducedMotion();
  const trapRef = useFocusTrap(open);
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] overflow-hidden" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              ref={trapRef}
              initial={reduced ? { opacity: 0 } : { x: '100%' }}
              animate={reduced ? { opacity: 1 } : { x: 0 }}
              exit={reduced ? { opacity: 0 } : { x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className={cn(
                'w-screen relative glass-card bg-[var(--cf-surface)]/95 backdrop-blur-2xl border-l border-[var(--cf-line)] shadow-2xl flex flex-col',
                wide ? 'max-w-2xl' : 'max-w-md',
                className
              )}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--cf-line)]">
                <h3 className="font-display font-bold text-base text-[var(--cf-ink)]">{title}</h3>
                <button
                  onClick={onClose}
                  aria-label="Close drawer"
                  className="p-2 rounded-xl text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)] hover:bg-black/[0.05] dark:hover:bg-white/10 transition"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Tooltip({ content, children, side = 'top', className }) {
  const [visible, setVisible] = useState(false);
  const positionClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }[side] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
            className={cn(
              'pointer-events-none absolute z-50 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap bg-[#100D0B] text-white border border-white/10 shadow-lg',
              positionClass,
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProgressRing({ value = 0, max = 100, size = 64, stroke = 6, color, label, className }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (pct / 100) * circumference;
  const ringColor = color || (pct >= 75 ? '#25D890' : pct >= 50 ? '#FFBD4A' : '#FF5964');

  return (
    <div className={cn('relative inline-grid place-items-center shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--cf-line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display font-bold tabular-nums text-xs sm:text-sm text-[var(--cf-ink)]">
          {Math.round(pct)}%
        </span>
        {label && <span className="text-[9px] text-[var(--cf-ink-mute)] leading-none">{label}</span>}
      </div>
    </div>
  );
}

export function StepBar({ steps = [], current = 0, className }) {
  return (
    <div className={cn('w-full flex items-center gap-1.5', className)} role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={steps.length}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const label = typeof step === 'string' ? step : step?.label;
        return (
          <div key={i} className="flex-1">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                done ? 'bg-[#D86D3E]' : active ? 'bg-[#B4806A] shadow-[0_0_8px_rgba(180,128,106,0.6)]' : 'bg-black/[0.08] dark:bg-white/10'
              )}
              title={label}
            />
            {label && (
              <p className={cn('mt-1 text-[10px] truncate', active ? 'font-semibold text-[#D86D3E] dark:text-[#F5B08A]' : 'text-[var(--cf-ink-mute)]')}>
                {label}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
