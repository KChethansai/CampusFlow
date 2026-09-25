import { useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, X } from 'lucide-react';
import { useFocusTrap } from '../../system/focusTrap';
import {
  drawerSpring,
  resolveTransition,
  staggerChild,
  staggerParent,
  useReducedMotion
} from '../../system/motion';

// Landing-only mobile drawer (never the app shell). Kinetic entrance consumes
// drawerSpring + stagger; Escape closes; focus is trapped while open and
// restored to the trigger on close via useFocusTrap cleanup.
export default function LandingDrawer({ links, onClose }) {
  const reduced = useReducedMotion();
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={resolveTransition(reduced, { duration: 0.2 })}
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
      />
      <motion.nav
        ref={trapRef}
        id="landing-mobile-drawer"
        aria-label="Mobile"
        initial={reduced ? { opacity: 0 } : drawerSpring.initial}
        animate={reduced ? { opacity: 1 } : drawerSpring.animate}
        exit={reduced ? { opacity: 0 } : drawerSpring.exit}
        transition={resolveTransition(reduced, drawerSpring.transition)}
        className="cf-glass absolute right-0 top-0 bottom-0 w-[19rem] max-w-[85vw] border-l border-black/10 dark:border-white/15 p-4 overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#A94727] text-white grid place-items-center font-display font-bold text-sm" aria-hidden>
              C
            </span>
            <span className="font-display font-semibold tracking-tight text-[17px]">CampusFlow</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="min-w-11 min-h-11 grid place-items-center rounded-full text-[#4B5563] dark:text-[#A7B0BF] hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A94727]"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <motion.div
          variants={reduced ? undefined : staggerParent(0.06, 0.08)}
          initial="initial"
          animate="animate"
        >
          {links.map((n) => (
            <motion.div key={n.label} variants={reduced ? undefined : staggerChild}>
              <a
                href={n.href}
                onClick={onClose}
                className="flex items-center justify-between gap-2 rounded-2xl px-4 min-h-11 py-2.5 text-[15px] font-medium text-[#100D0B] dark:text-[#F5F7FA] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A94727]"
              >
                {n.label}
                <ArrowRight size={16} aria-hidden className="text-[#D86D3E] dark:text-[#F5B08A]" />
              </a>
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          variants={reduced ? undefined : staggerParent(0.06, 0.3)}
          initial="initial"
          animate="animate"
          className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 flex flex-col gap-2"
        >
          <motion.div variants={reduced ? undefined : staggerChild}>
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center justify-center rounded-full min-h-11 px-4 text-sm font-semibold border border-black/10 dark:border-white/15 hover:border-[#D86D3E]/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A94727]"
            >
              Sign In
            </Link>
          </motion.div>
          <motion.div variants={reduced ? undefined : staggerChild}>
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 rounded-full min-h-11 px-4 text-sm font-semibold bg-[#A94727] text-white hover:brightness-110 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A94727]"
            >
              Get Started <ArrowRight size={15} aria-hidden />
            </Link>
          </motion.div>
        </motion.div>
      </motion.nav>
    </motion.div>
  );
}
