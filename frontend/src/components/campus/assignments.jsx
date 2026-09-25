// Campus assignment widgets — task cards + local detail drawer.
// Lane math (laneOf/classify) and submit/grade flows stay in callers.
import { memo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../system/tokens';
import { useFocusTrap } from '../../system/focusTrap';
import { Badge } from '../ui/primitives';

/** Task card: spotlight hover-lift over the urgency-lane surface. */
export const AssignmentCard = memo(function AssignmentCard({
  title,
  description,
  meta,
  badge,
  statusBadge,
  footer,
  onOpen
}) {
  return (
    <article className="cf-card-spot rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface)]/60 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <button onClick={onOpen} className="min-w-0 text-left font-display font-semibold leading-snug hover:text-[#D86D3E] transition">
          {title}
        </button>
        {badge}
      </div>
      <p className="text-sm text-[var(--cf-ink-mute)] line-clamp-2 mb-3">{description || '—'}</p>
      {meta && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--cf-ink-mute)] mb-3">
          {meta}
        </div>
      )}
      {(statusBadge || footer) && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--cf-line)]">
          {statusBadge}
          {footer}
        </div>
      )}
    </article>
  );
});

/** Progress hairline: submitted/graded share of a lane or assignment. */
export function LaneProgress({ done, total, label }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${label || 'Progress'}: ${done} of ${total}`}>
      <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden" aria-hidden>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#25D890' }} />
      </div>
      <span className="text-[11px] tabular-nums text-[var(--cf-ink-mute)]">
        {done}/{total}
      </span>
    </div>
  );
}

/** Local detail drawer: slide-over for one assignment. Flows stay in caller. */
export function DetailDrawer({ open, onClose, title, children }) {
  const reduced = useReducedMotion();
  const trapRef = useFocusTrap(open);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : 'Details'}
            className={cn(
              'fixed right-0 top-0 z-[71] h-full w-[calc(100vw-2rem)] sm:max-w-md overflow-y-auto',
              'bg-[var(--cf-surface)] border-l border-[var(--cf-line)] shadow-brutal-lg p-5'
            )}
            initial={reduced ? { opacity: 0 } : { x: '100%' }}
            animate={reduced ? { opacity: 1 } : { x: 0 }}
            exit={reduced ? { opacity: 0 } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose?.();
            }}
            tabIndex={-1}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-base font-bold tracking-tight">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close details"
                className="p-2 rounded-[14px] text-[var(--cf-ink-mute)] hover:bg-black/[.05] dark:hover:bg-white/10 hover:text-[var(--cf-ink)] transition"
              >
                <X size={16} aria-hidden />
              </button>
            </div>
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function PriorityBadge({ status, children }) {
  return <Badge status={status}>{children}</Badge>;
}
