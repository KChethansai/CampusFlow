// Assignments as a task-management product: All / Upcoming / Submitted / Graded / Overdue.
// Faculty: create, publish (status), review, grade. Students: submit.
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, Card, EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';
import { Modal } from '../../components/ui/Modal';
import { staggerChild, staggerParent } from '../../system/motion';
import { btnClass, cn, inputClass, labelClass, selectClass } from '../../system/tokens';

const VIEWS = ['All', 'Upcoming', 'Submitted', 'Graded', 'Overdue'];

const classify = (a, submissions) => {
  const mine = submissions.filter((s) => String(s.assignment?._id || s.assignment) === String(a._id));
  const graded = mine.find((s) => s.status === 'graded' || s.score != null);
  if (graded || a.status === 'graded') return 'Graded';
  if (mine.length) return 'Submitted';
  if (a.dueDate && new Date(a.dueDate).getTime() < Date.now()) return 'Overdue';
  return 'Upcoming';
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function Assignments() {
  const { user } = useAuth();
  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [submitFor, setSubmitFor] = useState(null);
  const [gradeFor, setGradeFor] = useState(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { subject: '', title: '', description: '', maxScore: 100, dueDate: '' }
  });

  const fetchAll = async () => {
    const [a, s] = await Promise.allSettled([api.get('/assignments'), api.get('/submissions')]);
    if (a.status === 'fulfilled') setAssignments(a.value.data.data || []);
    if (s.status === 'fulfilled') setSubmissions(s.value.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    if (isFaculty) api.get('/subjects').then(({ data }) => setSubjects(data.data || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFaculty]);

  const visible = useMemo(
    () => assignments.filter((a) => view === 'All' || classify(a, submissions) === view),
    [assignments, submissions, view]
  );

  const onCreate = async (form) => {
    try {
      await api.post('/assignments', form);
      toast.success('Assignment created as draft');
      setShowForm(false);
      reset();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const publish = async (a) => {
    try {
      await api.patch(`/assignments/${a._id}/status`, { status: a.status === 'draft' ? 'published' : 'open' });
      toast.success('Assignment status updated');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status transition not allowed');
    }
  };

  const submit = async (e, id) => {
    e.preventDefault();
    const text = new FormData(e.target).get('notes');
    try {
      await api.post('/submissions', { assignment: id, textNotes: text });
      toast.success('Submitted');
      setSubmitFor(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    }
  };

  const grade = async (e, id) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.patch(`/submissions/${id}`, {
        score: Number(fd.get('score')),
        feedback: fd.get('feedback'),
        status: 'graded'
      });
      toast.success('Graded');
      setGradeFor(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grade');
    }
  };

  const counts = useMemo(() => {
    const c = Object.fromEntries(VIEWS.map((v) => [v, 0]));
    assignments.forEach((a) => { c[classify(a, submissions)]++; c.All++; });
    return c;
  }, [assignments, submissions]);

  return (
    <div>
      <PageHeader
        title="Assignments"
        subtitle={`${assignments.length} assignments · ${submissions.length} submissions on record`}
        actions={isFaculty && (
          <button onClick={() => setShowForm(true)} className={btnClass('primary', 'medium')}>
            <Plus size={15} /> Create
          </button>
        )}
      />

      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4" role="tablist" aria-label="Assignment views">
        {VIEWS.map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
            className={cn('px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition',
              view === v ? 'bg-primary-600 text-white shadow-1' : 'bg-black/[.04] dark:bg-white/10 text-[var(--cf-ink-soft)] hover:bg-black/[.07]')}>
            {v} · {counts[v]}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : visible.length === 0 ? (
        <Card><EmptyState editorial title={`No ${view.toLowerCase()} assignments`} hint="Try another view." /></Card>
      ) : (
        <motion.div {...staggerParent(0.04)} initial="initial" animate="animate" className="grid md:grid-cols-2 gap-3">
          {visible.map((a) => {
            const mine = submissions.filter((s) => String(s.assignment?._id || s.assignment) === String(a._id));
            const state = classify(a, submissions);
            return (
              <motion.article key={a._id} variants={staggerChild} className="rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-line)] shadow-1 p-5 hover:shadow-2 transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold leading-snug">{a.title}</h3>
                  <Badge status={a.status || 'draft'}>{(a.status || 'draft').replace(/_/g, ' ')}</Badge>
                </div>
                <p className="text-sm text-[var(--cf-ink-mute)] line-clamp-2 mb-3">{a.description || 'No description'}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--cf-ink-mute)] mb-3">
                  <span>{a.subject?.name || 'Subject'}</span>
                  <span>{a.maxScore} pts</span>
                  <span className={cn('font-medium', state === 'Overdue' && 'text-red-600 dark:text-red-400')}>Due {fmt(a.dueDate)}</span>
                  {mine[0]?.score != null && <span className="font-semibold text-green-600 dark:text-green-400">Score {mine[0].score}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {isFaculty && ['draft', 'published'].includes(a.status) && (
                    <button onClick={() => publish(a)} className={btnClass('secondary', 'small')}>
                      {a.status === 'draft' ? 'Publish' : 'Open'}
                    </button>
                  )}
                  {isFaculty && (
                    <button onClick={() => setGradeFor(a)} className={btnClass('outline', 'small')}>Review submissions</button>
                  )}
                  {isStudent && state !== 'Graded' && (
                    <button onClick={() => setSubmitFor(a)} className={btnClass('primary', 'small')}>
                      {state === 'Submitted' ? 'Resubmit' : 'Submit'}
                    </button>
                  )}
                  {mine[0]?.feedback && (
                    <span className="text-xs text-[var(--cf-ink-mute)] italic">“{mine[0].feedback}”</span>
                  )}
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create assignment">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="as-subject">Subject</label>
            <select id="as-subject" className={selectClass} {...register('subject', { required: true })}>
              <option value="">Select subject</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="as-title">Title</label>
            <input id="as-title" className={inputClass} placeholder="Problem set 4" {...register('title', { required: true })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="as-desc">Description</label>
            <textarea id="as-desc" className={inputClass} rows={3} {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="as-score">Max score</label>
              <input id="as-score" type="number" className={inputClass} {...register('maxScore', { valueAsNumber: true })} />
            </div>
            <div>
              <label className={labelClass} htmlFor="as-due">Due date</label>
              <input id="as-due" type="date" className={inputClass} {...register('dueDate', { required: true })} />
            </div>
          </div>
          <button type="submit" className={btnClass('success', 'medium') + ' w-full'}>Create draft</button>
        </form>
      </Modal>

      <Modal open={Boolean(submitFor)} onClose={() => setSubmitFor(null)} title={`Submit — ${submitFor?.title}`}>
        <form onSubmit={(e) => submit(e, submitFor._id)} className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="sub-notes">Notes / answer link</label>
            <textarea id="sub-notes" name="notes" className={inputClass} rows={4} placeholder="Paste your answer, repo link, or notes…" required />
          </div>
          <button type="submit" className={btnClass('primary', 'medium') + ' w-full'}>Submit assignment</button>
        </form>
      </Modal>

      <Modal open={Boolean(gradeFor)} onClose={() => setGradeFor(null)} title={`Submissions — ${gradeFor?.title}`} wide>
        {submissions.filter((s) => String(s.assignment?._id || s.assignment) === String(gradeFor?._id)).length === 0 ? (
          <EmptyState title="No submissions yet" hint="Share the assignment link with your class." />
        ) : (
          <ul className="space-y-3">
            {submissions.filter((s) => String(s.assignment?._id || s.assignment) === String(gradeFor?._id)).map((s) => (
              <li key={s._id} className="rounded-xl border border-[var(--cf-line)] p-3.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium">{s.student?.name || 'Student'}</p>
                  <Badge status={s.status || 'submitted'}>{(s.status || 'submitted').replace(/_/g, ' ')}</Badge>
                </div>
                {s.textNotes && <p className="text-xs text-[var(--cf-ink-mute)] mb-2 line-clamp-3">{s.textNotes}</p>}
                <form onSubmit={(e) => grade(e, s._id)} className="flex flex-wrap gap-2 items-end">
                  <div className="w-24">
                    <label className={labelClass} htmlFor={`score-${s._id}`}>Score</label>
                    <input id={`score-${s._id}`} name="score" type="number" min={0} max={gradeFor?.maxScore} defaultValue={s.score ?? ''} className={inputClass} required />
                  </div>
                  <div className="flex-1 min-w-[10rem]">
                    <label className={labelClass} htmlFor={`fb-${s._id}`}>Feedback</label>
                    <input id={`fb-${s._id}`} name="feedback" defaultValue={s.feedback || ''} className={inputClass} placeholder="Good work — watch…" />
                  </div>
                  <button type="submit" className={btnClass('success', 'small')}>Grade</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
