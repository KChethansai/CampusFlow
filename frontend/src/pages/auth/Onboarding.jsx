// Role-based onboarding. Persists locally (no self-update endpoint exists
// server-side) and unlocks the dashboard on completion.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/useAuth';
import { Input, Select } from '../../components/ui/primitives';
import { btnClass, cn } from '../../system/tokens';
import AuthLayout from './AuthLayout';

const STEP_COPY = {
  student: ['Your institution', 'Department & semester', 'Profile & goals'],
  faculty: ['Department', 'Subjects & responsibilities'],
  placement_officer: ['Placement configuration'],
  college_admin: ['Institution configuration'],
  super_admin: ['Platform configuration']
};

const AVATARS = [
  { id: 'scholar', label: 'Scholar', gradient: 'from-primary-500 to-accent-violet' },
  { id: 'mentor', label: 'Mentor', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'builder', label: 'Builder', gradient: 'from-amber-500 to-orange-600' },
  { id: 'explorer', label: 'Explorer', gradient: 'from-sky-500 to-indigo-600' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'student';
  const steps = STEP_COPY[role] || STEP_COPY.student;
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validStep = () => {
    if (role === 'student' && step === 0) return Boolean(form.institution?.trim() && form.rollNumber?.trim());
    if (role === 'student' && step === 1) return Boolean(form.department?.trim());
    if (role === 'faculty' && step === 0) return Boolean(form.department?.trim());
    return true;
  };

  const next = () => {
    if (!validStep()) { toast.error('Fill the required fields to continue.'); return; }
    setDir(1); setStep((s) => s + 1);
  };
  const back = () => { setDir(-1); setStep((s) => s - 1); };

  const finish = () => {
    try {
      localStorage.setItem('cf_onboarding', JSON.stringify({ role, ...form, doneAt: new Date().toISOString() }));
    } catch { /* ignore */ }
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthLayout
      title={steps[step]}
      subtitle={`Step ${step + 1} of ${steps.length} · ${role.replace(/_/g, ' ')}`}
    >
      <div className="flex gap-1.5 mb-5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={steps.length} aria-label="Onboarding progress">
        {steps.map((_, i) => (
          <span key={i} className="h-1.5 flex-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden relative">
            {i <= step && <motion.span layoutId={i === step ? 'cf-onboard-pill' : undefined} className="absolute inset-0 rounded-full bg-primary-500" transition={{ type: 'spring', stiffness: 350, damping: 25 }} />}
          </span>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
      <motion.div key={step} initial={{ opacity: 0, x: 24 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 * dir }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}>
        {step === steps.length - 1 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Choose your profile style</p>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Profile style">
              {AVATARS.map((a) => {
                const active = form.avatar === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setForm((f) => ({ ...f, avatar: a.id }))}
                    className={cn('flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition', active ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-[var(--cf-line)] hover:border-primary-300')}
                  >
                    <span className={cn('w-9 h-9 rounded-full bg-gradient-to-br grid place-items-center text-white text-sm font-bold', a.gradient)} aria-hidden>
                      {(user?.name?.[0] || a.label[0]).toUpperCase()}
                    </span>
                    <span className="text-[11px] font-medium">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {role === 'student' && step === 0 && (
          <div className="space-y-4">
            <Input label="Institution" placeholder="e.g. National Institute of Technology" value={form.institution || ''} onChange={set('institution')} />
            <Input label="Roll number" placeholder="e.g. CS21B1042" value={form.rollNumber || ''} onChange={set('rollNumber')} />
          </div>
        )}
        {role === 'student' && step === 1 && (
          <div className="space-y-4">
            <Input label="Department" placeholder="e.g. Computer Science" value={form.department || ''} onChange={set('department')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Semester" placeholder="e.g. 5" value={form.semester || ''} onChange={set('semester')} />
              <Input label="Batch year" placeholder="e.g. 2027" value={form.batchYear || ''} onChange={set('batchYear')} />
            </div>
          </div>
        )}
        {role === 'student' && step === 2 && (
          <div className="space-y-4">
            <Input label="Interests" placeholder="e.g. Systems, ML, Design" value={form.interests || ''} onChange={set('interests')} />
            <Select label="Placement goal" value={form.placementGoal || 'full-time'} onChange={set('placementGoal')}>
              <option value="full-time">Full-time</option>
              <option value="internship">Internship</option>
              <option value="higher-studies">Higher studies</option>
            </Select>
          </div>
        )}
        {role === 'faculty' && (
          <div className="space-y-4">
            <Input label={step === 0 ? 'Department' : 'Subjects you teach'} placeholder={step === 0 ? 'e.g. Mathematics' : 'e.g. Linear Algebra, Calculus'} value={form[step === 0 ? 'department' : 'subjects'] || ''} onChange={set(step === 0 ? 'department' : 'subjects')} />
            {step === 1 && <Input label="Teaching responsibilities" placeholder="e.g. Class advisor, 2nd year" value={form.responsibilities || ''} onChange={set('responsibilities')} />}
          </div>
        )}
        {!['student', 'faculty'].includes(role) && (
          <div className="space-y-4">
            <Input label={step === 0 ? 'Institution / scope' : 'Configuration note'} placeholder="e.g. Main campus" value={form.scope || ''} onChange={set('scope')} />
          </div>
        )}
      </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button onClick={back} className={btnClass('outline', 'large') + ' flex-1'}>Back</button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={next} className={btnClass('primary', 'large') + ' flex-1'}>Continue</button>
        ) : (
          <button onClick={finish} className={btnClass('glow', 'large') + ' flex-1'}>Enter CampusFlow</button>
        )}
      </div>
      <p className="mt-4 text-[11px] text-center text-[var(--cf-ink-mute)]">
        Preferences are saved on this device. Official records (roll number, department, enrollment) are managed by your administrator.
      </p>
    </AuthLayout>
  );
}
