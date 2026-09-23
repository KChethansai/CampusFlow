// QuickAction: role-adapted floating action. One entry per role family.
// Particle/shimmer FAB treatment via local Motion only (no new files, no new deps).
// Role routes unchanged.
// NOTE: components/ui/{buttons,cards,overlays}/ do not exist in this repo — composed locally.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { EASE_OUT, useReducedMotion } from '../system/motion';

const ACTIONS = {
  student: [
    { label: 'Apply to drive', to: '/placement' },
    { label: 'View attendance', to: '/attendance' },
    { label: 'Open assignments', to: '/assignments' }
  ],
  faculty: [
    { label: 'Take attendance', to: '/attendance' },
    { label: 'Create assignment', to: '/assignments' },
    { label: 'Post announcement', to: '/events' }
  ],
  super_admin: [
    { label: 'Add user', to: '/users' },
    { label: 'Add course', to: '/courses' },
    { label: 'Add department', to: '/departments' }
  ],
  college_admin: [
    { label: 'Add user', to: '/users' },
    { label: 'Add course', to: '/courses' },
    { label: 'Add department', to: '/departments' }
  ],
  placement_officer: [
    { label: 'Add company', to: '/placement' },
    { label: 'Post drive', to: '/placement' },
    { label: 'Review applicants', to: '/placement' }
  ]
};

export default function QuickAction({ role }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const actions = ACTIONS[role] || ACTIONS.student;

  return (
    <div className="fixed bottom-20 lg:bottom-8 right-4 sm:right-6 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open &&
          actions.map((a, i) => (
            <motion.button
              key={a.label}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
              transition={reduced ? { duration: 0.01 } : { duration: 0.22, ease: EASE_OUT, delay: i * 0.05 }}
              onClick={() => { setOpen(false); navigate(a.to); }}
              className="cf-glass pl-4 pr-5 min-h-11 py-2 rounded-full border border-[var(--cf-line)] shadow-[0_12px_32px_-12px_rgba(16,24,40,0.3)] font-display text-sm font-semibold text-[var(--cf-ink)] flex items-center gap-2 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[#D86D3E]/40 hover:text-[#D86D3E] dark:hover:text-[#8db4ff]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#E7A66D]" aria-hidden />
              {a.label}
            </motion.button>
          ))}
      </AnimatePresence>
      {/* Rising particles on open */}
      <AnimatePresence>
        {open && !reduced && (
          <span aria-hidden className="pointer-events-none absolute bottom-14 right-6 flex flex-col items-center gap-1.5">
            {[0, 1, 2].map((p) => (
              <motion.span
                key={p}
                initial={{ opacity: 0, y: 6, scale: 0.5 }}
                animate={{ opacity: [0, 1, 0], y: -26 - p * 8, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: EASE_OUT, delay: p * 0.12, repeat: Infinity, repeatDelay: 0.4 }}
                className={p === 1 ? 'h-1.5 w-1.5 rounded-full bg-[#E7A66D]' : 'h-1 w-1 rounded-full bg-[#D86D3E]/70'}
              />
            ))}
          </span>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={open}
        whileTap={reduced ? undefined : { scale: 0.92 }}
        className="relative w-14 h-14 grid place-items-center rounded-full bg-[#A94727] text-white shadow-[0_16px_40px_-8px_rgba(216,109,62,0.65)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 overflow-hidden"
      >
        {/* Shimmer sweep */}
        {!reduced && (
          <motion.span
            aria-hidden
            initial={{ x: '-160%' }}
            animate={{ x: '160%' }}
            transition={{ duration: 2.6, ease: 'linear', repeat: Infinity, repeatDelay: 1.4 }}
            className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        )}
        <span className="relative" aria-hidden>
          {open ? <X size={24} /> : <Plus size={24} />}
        </span>
      </motion.button>
    </div>
  );
}
