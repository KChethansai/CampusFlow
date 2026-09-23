// Assignments as an urgency timeline: Today / This Week / Later (+ Overdue,
// Graded rails) with priority tags. Faculty: create, publish (status),
// review, grade. Students: submit.
// Endpoints preserved: GET /assignments, GET /submissions, GET /subjects,
// POST /assignments, PATCH /assignments/:id/status,
// POST /submissions/assignments/:id, PATCH /submissions/:id.
// Submit/grade logic untouched.
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';
import { Dropzone } from '../../components/data/views';
import { Modal } from '../../components/ui/Modal';
import FilePreview from '../../components/ui/FilePreview';

// Mirrors backend/middlewares/upload.js SUBMISSION_EXTS — keep in sync.
const SUBMISSION_ACCEPT = '.pdf,.doc,.docx,.txt,.md,.csv,.zip,.png,.jpg,.jpeg';
import { staggerChild, staggerParent } from '../../system/motion';
import { btnClass, cn, inputClass, labelClass, selectClass } from '../../system/tokens';

const GLASS = 'cf-glass rounded-[24px] border border-[var(--cf-line)] p-5';
const LIFT = 'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg';

const classify = (a, submissions) => {
  const mine = submissions.filter((s) => String(s.assignment?._id || s.assignment) === String(a._id));
  const graded = mine.find((s) => s.status === 'graded' || s.score != null);
  if (graded || a.status === 'graded') return 'Graded';
  if (mine.length) return 'Submitted';
  if (a.dueDate && new Date(a.dueDate).getTime() < Date.now()) return 'Overdue';
  return 'Upcoming';
};

// Urgency lane for the timeline — real due dates only.
const laneOf = (a, submissions) => {
  const state = classify(a, submissions);
  if (state === 'Overdue') return 'Overdue';
  if (state === 'Graded' || state === 'Submitted') return 'Settled';
  if (!a.dueDate) return 'Later';
  const ms = new Date(a.dueDate).getTime() - Date.now();
  if (ms < 86400000) return 'Today';
  if (ms < 86400000 * 7) return 'This Week';
  return 'Later';
};

// Priority tags map onto the single status-pill language:
// red = overdue/urgent, amber = due soon, green = on track.
const priorityOf = (a, submissions) => {
  const lane = laneOf(a, submissions);
  if (lane === 'Overdue') return { status: 'absent', label: 'Urgent' };
  if (lane === 'Today') return { status: 'late', label: 'Due soon' };
  if (lane === 'This Week') return { status: 'pending', label: 'This week' };
  if (lane === 'Settled') return { status: 'graded', label: classify(a, submissions) };
  return { status: 'present', label: 'On track' };
};

const LANES = ['Overdue', 'Today', 'This Week', 'Later', 'Settled'];

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function Assignments() {
  const { user } = useAuth();
  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitFor, setSubmitFor] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
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

  const lanes = useMemo(() => {
    const groups = Object.fromEntries(LANES.map((l) => [l, []]));
    [...assignments]
      .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
      .forEach((a) => { groups[laneOf(a, submissions)].push(a); });
    return groups;
  }, [assignments, submissions]);

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

  const submitFiles = async ({ id, files, notes }) => {
    const form = new FormData();
    if (files?.[0]) form.append('file', files[0]);
    form.append('comments', notes || '');
    try {
      await api.post(`/submissions/assignments/${id}`, form, {
        onUploadProgress: (ev) => {
          if (!ev.total) return;
          setUploadProgress(ev.loaded / ev.total);
        }
      });
      toast.success(files?.[0] ? 'File submitted' : 'Submitted');
      setSubmitFor(null);
      setUploadProgress(null);
      fetchAll();
    } catch (err) {
      const status = err.response?.status;
      setUploadProgress(null);
      toast.error(
        status === 413 ? 'File too large — try a smaller file.' :
        status === 415 ? 'Unsupported file type — use PDF, Word, text, CSV, ZIP or an image.' :
        !err.response ? 'Network error — check your connection and retry.' :
        err.response?.data?.message || 'Failed to submit'
      );
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

  const urgentCount = lanes.Overdue.length + lanes.Today.length;

  return (
    <div>
      <PageHeader
        title="Assignments"
        subtitle={`${assignments.length} assignments · ${submissions.length} submissions on record${urgentCount ? ` · ${urgentCount} need you now` : ''}`}
        actions={isFaculty && (
          <button onClick={() => setShowForm(true)} className={btnClass('primary', 'medium')}>
            <Plus size={15} /> Create
          </button>
        )}
      />

      {loading ? <LoadingState /> : assignments.length === 0 ? (
        <div className={GLASS}><EmptyState editorial title="No assignments yet" hint="New work will land here." /></div>
      ) : (
        <motion.div {...staggerParent(0.04)} initial="initial" animate="animate" className="space-y-4">
          {LANES.map((lane) => (
            lanes[lane].length > 0 && (
              <motion.section key={lane} variants={staggerChild} className={GLASS} aria-label={`${lane} assignments`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-base font-semibold flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      aria-hidden
                      style={{ background: lane === 'Overdue' ? '#FF5964' : lane === 'Today' ? '#FFBD4A' : lane === 'Settled' ? '#25D890' : '#D86D3E' }}
                    />
                    {lane}
                    <span className="text-xs font-bold tabular-nums text-[var(--cf-ink-mute)]">{lanes[lane].length}</span>
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {lanes[lane].map((a) => {
                    const mine = submissions.filter((s) => String(s.assignment?._id || s.assignment) === String(a._id));
                    const state = classify(a, submissions);
                    const prio = priorityOf(a, submissions);
                    return (
                      <article key={a._id} className={`rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface)]/60 p-4 ${LIFT}`}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-display font-semibold leading-snug">{a.title}</h3>
                          <Badge status={prio.status}>{prio.label}</Badge>
                        </div>
                        <p className="text-sm text-[var(--cf-ink-mute)] line-clamp-2 mb-3">{a.description || 'No description'}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--cf-ink-mute)] mb-3">
                          <span>{a.subject?.name || 'Subject'}</span>
                          <span className="tabular-nums">{a.maxScore} pts</span>
                          <span className={cn('font-medium tabular-nums', state === 'Overdue' && 'text-red-600 dark:text-red-400')}>Due {fmt(a.dueDate)}</span>
                          {mine[0]?.score != null && <span className="rounded-full bg-[#E7A66D]/25 px-2 py-0.5 text-[11px] font-bold tabular-nums">Score {mine[0].score}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--cf-line)]">
                          <Badge status={a.status || 'draft'}>{(a.status || 'draft').replace(/_/g, ' ')}</Badge>
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
                      </article>
                    );
                  })}
                </div>
              </motion.section>
            )
          ))}
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

      <Modal open={Boolean(submitFor)} onClose={() => { setSubmitFor(null); setUploadProgress(null); }} title={`Submit — ${submitFor?.title}`}>
        <SubmitForm
          key={submitFor?._id}
          assignment={submitFor}
          progress={uploadProgress}
          onSubmit={submitFiles}
        />
      </Modal>

      <Modal open={Boolean(gradeFor)} onClose={() => setGradeFor(null)} title={`Submissions — ${gradeFor?.title}`} wide>
        {submissions.filter((s) => String(s.assignment?._id || s.assignment) === String(gradeFor?._id)).length === 0 ? (
          <EmptyState title="No submissions yet" hint="Share the assignment link with your class." />
        ) : (
          <ul className="space-y-3">
            {submissions.filter((s) => String(s.assignment?._id || s.assignment) === String(gradeFor?._id)).map((s) => (
              <li key={s._id} className="rounded-[14px] border border-[var(--cf-line)] p-3.5 bg-[var(--cf-surface-2)]/50">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium">{s.student?.name || 'Student'}</p>
                  <Badge status={s.status || 'submitted'}>{(s.status || 'submitted').replace(/_/g, ' ')}</Badge>
                </div>
                {s.textNotes && <p className="text-xs text-[var(--cf-ink-mute)] mb-2 line-clamp-3">{s.textNotes}</p>}
                <FilePreview fileUrl={s.fileUrl} fileName={s.fileName} />
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

function SubmitForm({ assignment, progress, onSubmit }) {
  const [files, setFiles] = useState(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        try { await onSubmit({ id: assignment._id, files, notes }); }
        finally { setBusy(false); }
      }}
    >
      <Dropzone
        onFiles={setFiles}
        accept={SUBMISSION_ACCEPT}
        progress={progress}
        label={files?.[0] ? files[0].name : 'Drop your file to submit'}
      />
      <div>
        <label className={labelClass} htmlFor="sub-notes">Notes / answer link</label>
        <textarea
          id="sub-notes"
          className={inputClass}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste your answer, repo link, or notes…"
        />
      </div>
      <button type="submit" disabled={busy} className={btnClass('primary', 'medium') + ' w-full'}>
        {busy ? 'Submitting…' : 'Submit assignment'}
      </button>
      {!files?.[0] && !notes.trim() && (
        <p className="text-xs text-[var(--cf-ink-mute)]">Attach a file or add notes to enable submission.</p>
      )}
    </form>
  );
}
