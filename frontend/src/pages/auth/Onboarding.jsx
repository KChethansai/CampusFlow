// Role-based onboarding. Persists locally (no self-update endpoint exists
// server-side) and unlocks the dashboard on completion.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../store/useAuth';
import { Input, Select } from '../../components/ui/primitives';
import { btnClass } from '../../system/tokens';
import AuthLayout from './AuthLayout';

const STEP_COPY = {
  student: ['Your institution', 'Department & semester', 'Interests & placements'],
  faculty: ['Department', 'Subjects & responsibilities'],
  placement_officer: ['Placement configuration'],
  college_admin: ['Institution configuration'],
  super_admin: ['Platform configuration']
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'student';
  const steps = STEP_COPY[role] || STEP_COPY.student;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
      <div className="flex gap-1.5 mb-5" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary-500' : 'bg-black/10 dark:bg-white/10'}`} />
        ))}
      </div>
      <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
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
      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className={btnClass('outline', 'large') + ' flex-1'}>Back</button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} className={btnClass('primary', 'large') + ' flex-1'}>Continue</button>
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
