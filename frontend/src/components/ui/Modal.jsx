// Modal: spring entrance, focus-trapped, ESC + backdrop close. Accessible dialog.
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { motionVariants } from '../../system/motion';
import { cn } from '../../system/tokens';

export function Modal({ open, onClose, title, children, wide }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('button, input, select, textarea')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm cursor-default"
          />
          <motion.div
            ref={panelRef}
            {...motionVariants.modal}
            className={cn(
              'relative w-full bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-t-3xl sm:rounded-3xl shadow-4 max-h-[92vh] overflow-y-auto',
              wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
            )}
          >
            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[var(--cf-line)] sticky top-0 bg-[var(--cf-surface)] z-10">
              <h2 className="text-base font-semibold text-[var(--cf-ink)]">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 rounded-full text-[var(--cf-ink-mute)] hover:bg-black/[.05] dark:hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>
            <div className="px-5 sm:px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
