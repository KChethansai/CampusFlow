// QuickAction: role-adapted floating action. One entry per role family.
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
          actions.map((a) => (
            <motion.button
              key={a.label}
              {...motionVariants.popover}
              onClick={() => { setOpen(false); navigate(a.to); }}
              className="cf-glass pl-4 pr-5 min-h-11 py-2 rounded-full border border-[var(--cf-line)] shadow-[0_12px_32px_-12px_rgba(16,24,40,0.3)] font-display text-sm font-semibold text-[var(--cf-ink)] flex items-center gap-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[#2563FF]/40 hover:text-[#2563FF] dark:hover:text-[#8db4ff]"
            >
              {a.label}
            </motion.button>
          ))}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={open}
        className="w-14 h-14 grid place-items-center rounded-full bg-[#2563FF] text-white shadow-[0_16px_40px_-8px_rgba(37,99,255,0.65)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 active:scale-95"
      >
        {open ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
