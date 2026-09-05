// QuickAction: role-adapted floating action. One entry per role family.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
              className="cf-glass border border-[var(--cf-line)] rounded-full pl-4 pr-5 py-2.5 text-sm font-medium text-[var(--cf-ink)] shadow-3 hover:shadow-4 transition-shadow"
            >
              {a.label}
            </motion.button>
          ))}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={open}
        className="w-13 h-13 p-3.5 rounded-full bg-primary-600 text-white shadow-glow hover:bg-primary-500 transition active:scale-95"
      >
        {open ? <X size={20} /> : <Plus size={20} />}
      </button>
    </div>
  );
}
