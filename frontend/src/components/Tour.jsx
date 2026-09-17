// Tour: QuickTourTooltip pattern — docked brutal card, spotlight target,
// ESC + backdrop close, localStorage dismiss, reduced-motion safe.
// steps: [{ target, title, body }] where target is a CSS selector or element id.
import { useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from './ui/primitives';

function useFirstRender() {
  const ref = useState(() => ({ current: true }))[0];
  useEffect(() => {
    ref.current = false;
  }, [ref]);
  return ref.current;
}

const resolveTarget = (target) => {
  if (!target || typeof document === 'undefined') return null;
  try {
    return document.querySelector(target) || document.getElementById(target);
  } catch {
    return document.getElementById(target);
  }
};

export function Tour({ steps = [], storageKey = 'cf_tour_dismissed', autoOpen = true, startSignal = 0, onDone }) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!autoOpen || steps.length === 0) return;
    try {
      if (localStorage.getItem(storageKey) === '1') return;
    } catch { /* ignore */ }
    setOpen(true);
  }, [autoOpen, steps.length, storageKey]);

  const firstSignal = useFirstRender();
  useEffect(() => {
    if (firstSignal || !startSignal || steps.length === 0) return;
    setIndex(0);
    setOpen(true);
  }, [startSignal, steps.length, firstSignal]);

  const close = useCallback(
    (persist = true) => {
      setOpen(false);
      if (persist) {
        try {
          localStorage.setItem(storageKey, '1');
        } catch { /* ignore */ }
      }
      onDone?.();
    },
    [storageKey, onDone]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const step = steps[index];

  useEffect(() => {
    if (!open || !step) return;
    const el = resolveTarget(step.target);
    if (!el) return;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    el.classList.add('tour-target-highlight');
    return () => el.classList.remove('tour-target-highlight');
  }, [open, step, reduced]);

  if (!open || !step) return null;
  const last = index === steps.length - 1;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-coal/25 backdrop-blur-[1px]"
        onClick={() => close()}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Tour: ${step.title}`}
        className="fixed z-[61] bottom-6 right-6 left-6 sm:left-auto sm:w-[420px] bg-[var(--cf-surface)] border-2 border-[var(--cf-ink)] shadow-brutal-lg rounded-2xl p-5 text-[var(--cf-ink)]"
      >
        <div className="racing-stripe h-1.5 -mx-5 -mt-5 mb-3 rounded-t-[14px]" aria-hidden />
        <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-[var(--cf-ink)]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest bg-volt text-coal border-2 border-[var(--cf-ink)] rounded-md">
              Tour
            </span>
            <span className="font-mono text-[11px] font-bold text-[var(--cf-ink-mute)]">
              {index + 1} / {steps.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => close()}
            aria-label="Exit tour"
            title="Exit tour (Esc)"
            className="p-1.5 border-2 border-transparent rounded-lg hover:border-[var(--cf-ink)] hover:bg-volt hover:text-coal transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="py-4">
          <h3 className="font-display text-base font-bold tracking-tight">{step.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--cf-ink-soft)]">{step.body}</p>
        </div>

        <div className="pt-3 border-t-2 border-[var(--cf-ink)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Tour progress">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to step ${i + 1}`}
                className={cn(
                  'h-2.5 border-2 border-[var(--cf-ink)] transition-all',
                  i === index ? 'w-5 bg-royal' : 'w-2.5 bg-[var(--cf-surface)] hover:bg-gold'
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1 font-display text-xs font-bold uppercase border-2 border-[var(--cf-ink)] rounded-lg bg-[var(--cf-surface)] hover:bg-[var(--cf-surface-2)] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <button
              type="button"
              onClick={() => (last ? close() : setIndex((i) => Math.min(steps.length - 1, i + 1)))}
              className="inline-flex items-center gap-1 px-3 py-1 font-display text-xs font-bold uppercase tracking-wide border-2 border-[var(--cf-ink)] rounded-lg bg-gold text-coal shadow-brutal-sm hover:bg-volt transition"
            >
              {last ? 'Finish' : 'Next'}
              {last ? <CheckCircle2 size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
