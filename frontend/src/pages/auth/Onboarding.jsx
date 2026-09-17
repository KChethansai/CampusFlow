// Role-based onboarding. Persists locally (no self-update endpoint exists
// server-side) and unlocks the dashboard on completion.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { useAuth } from '../../store/useAuth';
import { btnClass, cn, labelClass } from '../../system/tokens';
import { Input, Select } from '../../components/ui/primitives';
import AuthLayout from './AuthLayout';

const STEP_COPY = {
  student: ['Your institution', 'Department & semester', 'Profile & goals'],
  faculty: ['Department', 'Subjects & responsibilities'],
  placement_officer: ['Placement configuration'],
  college_admin: ['Institution configuration'],
  super_admin: ['Platform configuration']
};

const AVATARS = [
  { id: 'scholar', label: 'Scholar', bg: 'bg-[#2563FF]' },
  { id: 'mentor', label: 'Mentor', bg: 'bg-green-500' },
  { id: 'builder', label: 'Builder', bg: 'bg-violet-500' },
  { id: 'explorer', label: 'Explorer', bg: 'bg-cyan-500' }
];

const PROGRESS_KEY = 'cf_onboarding_progress';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'student';
  const steps = STEP_COPY[role] || STEP_COPY.student;
  const [step, setStep] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
      if (saved && saved.role === role && Number.isInteger(saved.step) && saved.step < steps.length) return saved.step;
    } catch { /* ignore */ }
    return 0;
  });
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
      if (saved && saved.role === role && saved.form) return saved.form;
    } catch { /* ignore */ }
    return {};
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Draft progress only — the cf_onboarding gate key is written on finish alone.
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ role, step, form }));
    } catch { /* ignore */ }
  }, [role, step, form]);

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
      localStorage.removeItem(PROGRESS_KEY);
    } catch { /* ignore */ }
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthLayout
      title={steps[step]}
      subtitle={`Step ${step + 1} of ${steps.length} · ${role.replace(/_/g, ' ')}`}
    >
      {/* Glass step tracker — numbered pills, current = primary with volt dot */}
      <ol className="flex gap-2 mb-6" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={steps.length} aria-label="Onboarding progress">
        {steps.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} className="flex-1 min-w-0" aria-current={current ? 'step' : undefined}>
              <div className={cn('flex items-center gap-1.5 rounded-full border px-2 py-1.5 transition-colors',
                current ? 'border-[#2563FF]/40 bg-[#2563FF] text-white' : done ? 'border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60 text-[var(--cf-ink)]' : 'border-[var(--cf-line)] bg-transparent text-[var(--cf-ink-mute)]')}>
                <span className={cn('w-5 h-5 shrink-0 grid place-items-center rounded-full text-[10px] font-display font-bold',
                  current ? 'bg-white/20 text-white' : 'bg-[var(--cf-surface-2)] text-[var(--cf-ink-soft)]')}>
                  {done ? <Check size={11} strokeWidth={3} aria-hidden /> : i + 1}
                </span>
                {current && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#A7D700]" aria-hidden />}
                <span className="truncate text-[11px] font-display font-semibold hidden sm:block">{label}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <AnimatePresence mode="wait" initial={false}>
      <motion.div key={step} initial={{ opacity: 0, x: 24 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 * dir }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}>
        {step === steps.length - 1 && (
          <div className="mb-4">
            <p className="text-sm font-display font-semibold mb-2">Choose your profile style</p>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Profile style">
              {AVATARS.map((a) => {
                const active = form.avatar === a.id;
                return (
                  <motion.button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setForm((f) => ({ ...f, avatar: a.id }))}
                    whileTap={{ scale: 0.96 }}
                    className={cn('flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition',
                      active ? 'border-[#2563FF]/50 bg-[#2563FF]/[.06]' : 'border-[var(--cf-line)] hover:border-[var(--cf-ink-mute)]')}
                  >
                    <span className={cn('w-9 h-9 rounded-xl grid place-items-center text-white text-sm font-bold', a.bg)} aria-hidden>
                      {(user?.name?.[0] || a.label[0]).toUpperCase()}
                    </span>
                    <span className="text-[11px] font-medium">{a.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
        {role === 'student' && step === 0 && (
          <div className="space-y-4">
            <Input id="ob-institution" label="Institution" placeholder="e.g. National Institute of Technology" value={form.institution || ''} onChange={set('institution')} />
            <Input id="ob-roll" label="Roll number" placeholder="e.g. CS21B1042" value={form.rollNumber || ''} onChange={set('rollNumber')} />
          </div>
        )}
        {role === 'student' && step === 1 && (
          <div className="space-y-4">
            <Input id="ob-dept" label="Department" placeholder="e.g. Computer Science" value={form.department || ''} onChange={set('department')} />
            <div className="grid grid-cols-2 gap-3">
              <Input id="ob-sem" label="Semester" placeholder="e.g. 5" value={form.semester || ''} onChange={set('semester')} />
              <Input id="ob-batch" label="Batch year" placeholder="e.g. 2027" value={form.batchYear || ''} onChange={set('batchYear')} />
            </div>
          </div>
        )}
        {role === 'student' && step === 2 && (
          <div className="space-y-4">
            <Input id="ob-interests" label="Interests" placeholder="e.g. Systems, ML, Design" value={form.interests || ''} onChange={set('interests')} />
            <div>
              <label htmlFor="ob-goal" className={labelClass}>Placement goal</label>
              <Select id="ob-goal" value={form.placementGoal || 'full-time'} onChange={set('placementGoal')}>
                <option value="full-time">Full-time</option>
                <option value="internship">Internship</option>
                <option value="higher-studies">Higher studies</option>
              </Select>
            </div>
          </div>
        )}
        {role === 'faculty' && (
          <div className="space-y-4">
            <Input id="ob-fac" label={step === 0 ? 'Department' : 'Subjects you teach'} placeholder={step === 0 ? 'e.g. Mathematics' : 'e.g. Linear Algebra, Calculus'} value={form[step === 0 ? 'department' : 'subjects'] || ''} onChange={set(step === 0 ? 'department' : 'subjects')} />
            {step === 1 && <Input id="ob-resp" label="Teaching responsibilities" placeholder="e.g. Class advisor, 2nd year" value={form.responsibilities || ''} onChange={set('responsibilities')} />}
          </div>
        )}
        {!['student', 'faculty'].includes(role) && (
          <div className="space-y-4">
            <Input id="ob-scope" label={step === 0 ? 'Institution / scope' : 'Configuration note'} placeholder="e.g. Main campus" value={form.scope || ''} onChange={set('scope')} />
          </div>
        )}
      </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button onClick={back} className={btnClass('outline', 'large') + ' flex-1'}>← Back</button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={next} className={btnClass('primary', 'large') + ' flex-1'}>Continue →</button>
        ) : (
          <button onClick={finish} className={btnClass('primary', 'large') + ' flex-1'}>Enter CampusFlow →</button>
        )}
      </div>
      <p className="mt-4 text-[11px] text-center text-[var(--cf-ink-mute)]">
        Preferences are saved on this device. Official records (roll number, department, enrollment) are managed by your administrator.
      </p>
    </AuthLayout>
  );
}
