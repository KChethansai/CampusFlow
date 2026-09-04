// CampusFlow motion language (Motion.dev). Fast, subtle, spring-led.
// All variants respect prefers-reduced-motion via useReducedMotion guard.
import { useEffect, useState } from 'react';

export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
};

const noMotion = { duration: 0.01 };

export const spring = { type: 'spring', stiffness: 380, damping: 32, mass: 0.9 };
export const softSpring = { type: 'spring', stiffness: 260, damping: 28 };

export const motionVariants = {
  page: {
    initial: { opacity: 0, y: 14, scale: 0.995 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
  },
  enter: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: 'easeOut' }
  },
  modal: {
    initial: { opacity: 0, scale: 0.96, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.97, y: 8 },
    transition: spring
  },
  popover: {
    initial: { opacity: 0, scale: 0.97, y: -4 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: -2 },
    transition: { duration: 0.16, ease: 'easeOut' }
  },
  expand: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
  }
};

export const staggerParent = (stagger = 0.05, delay = 0) => ({
  initial: {},
  animate: { transition: { staggerChildren: stagger, delayChildren: delay } }
});

export const staggerChild = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.26, ease: 'easeOut' } }
};

// Hover/press are applied via Tailwind classes (hover:, active:scale) to
// avoid JS animation overhead on every interactive element.
export const hoverLift = 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-3';
export const pressable = 'transition-transform duration-100 active:scale-[.98]';

export const resolveTransition = (reduced, transition) =>
  reduced ? noMotion : transition;
