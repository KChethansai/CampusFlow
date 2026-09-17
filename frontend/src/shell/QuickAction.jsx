// QuickAction: role-adapted brutal floating action. One entry per role family.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { motionVariants } from '../system/motion';

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
  const actions = ACTIONS[role] || ACTIONS.student;

  return (
    <div className="fixed bottom-20 lg:bottom-8 right-4 sm:right-6 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open &&
          actions.map((a, i) => (
            <motion.button
              key={a.label}
              {...motionVariants.popover}
              onClick={() => { setOpen(false); navigate(a.to); }}
              className="bg-[var(--cf-surface)] border-2 border-[var(--cf-ink)] shadow-brutal-sm hover:shadow-brutal hover:-translate-y-px transition-all pl-3 pr-4 min-h-11 py-2 font-display text-sm font-bold uppercase tracking-wide text-[var(--cf-ink)] flex items-center gap-2"
            >
              <span className="font-mono text-[10px] font-black bg-volt text-[#111111] border border-[var(--cf-ink)] px-1" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              {a.label}
            </motion.button>
          ))}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={open}
        className="w-12 h-12 grid place-items-center bg-volt text-[#111111] border-2 border-[var(--cf-ink)] shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
      >
        {open ? <X size={22} strokeWidth={2.5} /> : <Plus size={22} strokeWidth={2.5} />}
      </button>
    </div>
  );
}
