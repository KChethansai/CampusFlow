// Attendance: health-first experience — ring, trend, heatmap, course comparison.
// Faculty: mark attendance (POST /attendance).
// Endpoints preserved: GET /attendance, POST /attendance, GET /subjects,
// GET /users. Role gates + marking logic unchanged. Heatmap matrix restyled
// to the Obsidian Ember surface.
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Printer } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';
import { Modal } from '../../components/ui/Modal';
import { AttendanceRing, Heatmap, Sparkline } from '../../components/data/views';
import { btnClass, inputClass, labelClass, selectClass, statusBadge } from '../../system/tokens';

const STATUSES = ['present', 'absent', 'late', 'od'];
const GLASS = 'bg-[var(--cf-surface)] rounded-[24px] border border-[var(--cf-line)] p-5';

export default function Attendance() {
  const { user } = useAuth();
  const canMark = user?.role === 'faculty' || user?.role === 'hod';
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMark, setShowMark] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState(null);
  const [subjectId, setSubjectId] = useState('');
  const [period, setPeriod] = useState('1');
  const [marks, setMarks] = useState({});
  const [studentQuery, setStudentQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/attendance');
      setSessions(data.data || []);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
    if (canMark) {
      api.get('/subjects').then(({ data }) => {
        const list = data.data || [];
        // Default to the first accessible subject — taught subjects first for faculty.
        const sorted = [...list].sort((a, b) =>
          (isTaughtBy(b, user?._id) ? 1 : 0) - (isTaughtBy(a, user?._id) ? 1 : 0));
        setSubjects(sorted);
        if (sorted[0]) setSubjectId(sorted[0]._id);
      }).catch(() => {});
      api.get('/users').then(({ data }) => setStudents((data.data || []).filter((u) => u.role === 'student'))).catch(() => {});
      api.get('/enrollments').then(({ data }) => setEnrollments(data.data || [])).catch(() => setEnrollments([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canMark]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => String(s._id) === String(subjectId)),
    [subjects, subjectId]
  );
  const selectedCourseId = useMemo(() => {
    const c = selectedSubject?.course;
    return c ? String(c._id || c) : null;
  }, [selectedSubject]);

  // Scope the modal roster to students actively enrolled in the selected
  // subject's course — the backend 400s unenrolled students. Falls back to
  // profile.course when enrollment data is unavailable.
  const markableStudents = useMemo(() => {
    if (!selectedCourseId) return students;
    if (Array.isArray(enrollments)) {
      const enrolledIds = new Set(
        enrollments
          .filter((e) => e.status === 'active' && String(e.course?._id || e.course) === selectedCourseId)
          .map((e) => String(e.student?._id || e.student))
      );
      return students.filter((s) => enrolledIds.has(String(s._id)));
    }
    return students.filter((s) => String(s.profile?.course?._id || s.profile?.course || '') === selectedCourseId);
  }, [students, enrollments, selectedCourseId]);

  const visibleStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return markableStudents;
    return markableStudents.filter((s) =>
      [s.name, s.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [markableStudents, studentQuery]);

  const mine = useMemo(() => {
    if (!canMark && user?._id) {
      // Sessions carry full records; filter to own rows for the personal view.
      return sessions.map((s) => ({
        ...s,
        records: (s.records || []).filter((r) => String(r.student?._id || r.student) === String(user._id))
      })).filter((s) => s.records.length);
    }
    return sessions;
  }, [sessions, canMark, user?._id]);

  const recs = useMemo(() => mine.flatMap((s) => s.records || []), [mine]);
  const health = recs.length
    ? Math.round((recs.filter((r) => ['present', 'late', 'od'].includes(r.status)).length / recs.length) * 100)
    : null;
  const missed = recs.filter((r) => r.status === 'absent').length;

  const trend = useMemo(() => mine.slice(-10).map((s) => {
    const r = s.records || [];
    if (!r.length) return 0;
    return Math.round((r.filter((x) => x.status === 'present').length / r.length) * 100);
  }), [mine]);

  const weeks = useMemo(() => {
    // Last 4 weeks × 7 days intensity from session presence.
    const cols = Array.from({ length: 4 }, () => Array(7).fill(0));
    const now = Date.now();
    mine.forEach((s) => {
      if (!s.date) return;
      const age = Math.floor((now - new Date(s.date).getTime()) / 86400000);
      if (age < 0 || age >= 28) return;
      const col = 3 - Math.floor(age / 7);
      const row = new Date(s.date).getDay();
      const r = s.records || [];
      const rate = r.length ? r.filter((x) => x.status === 'present').length / r.length : 0;
      cols[col][row] = Math.max(cols[col][row], Math.ceil(rate * 4));
    });
    return cols;
  }, [mine]);

  const byCourse = useMemo(() => {
    const m = {};
    mine.forEach((s) => {
      const name = s.subject?.name || 'General';
      (m[name] = m[name] || []).push(...(s.records || []));
    });
    return Object.entries(m).map(([name, rows]) => ({
      name,
      pct: rows.length ? Math.round((rows.filter((r) => ['present', 'late', 'od'].includes(r.status)).length / rows.length) * 100) : 0,
      n: rows.length
    })).sort((a, b) => a.pct - b.pct);
  }, [mine]);

  const markAll = (status) => {
    const next = {};
    markableStudents.forEach((s) => { next[s._id] = status; });
    setMarks(next);
  };

  const saveSession = async () => {
    if (!subjectId) return toast.error('Select a subject');
    if (saving) return;
    const records = markableStudents.map((s) => ({ student: s._id, status: marks[s._id] || 'present' }));
    setSaving(true);
    try {
      await api.post('/attendance', {
        subject: subjectId,
        date: new Date().toISOString(),
        period: Number(period) || 1,
        records
      });
      toast.success(`Attendance marked for ${records.length} students`);
      setShowMark(false);
      setMarks({});
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  return (
    <div className="print-report">
      <PageHeader
        title="Attendance"
        subtitle={health == null ? 'No sessions recorded yet.' : `${recs.length} records · ${missed} missed classes`}
        actions={<div className="flex flex-wrap gap-2 print-hide">
          <button type="button" onClick={() => window.print()} className={btnClass('outline', 'small')}><Printer size={14} aria-hidden /> Export / print</button>
          {canMark && <button onClick={() => setShowMark(true)} className={btnClass('primary', 'medium')}><Plus size={15} /> Mark attendance</button>}
        </div>}
      />

      {loading ? <LoadingState /> : health == null ? (
        <div className={GLASS}><EmptyState title="No attendance yet" hint={canMark ? 'Mark your first session to activate this view.' : 'Your attendance will appear here once classes are marked.'} /></div>
      ) : (
        <>
          {/* Hero pulse: health gauge + trajectory + glass heatmap matrix */}
          <section className={`${GLASS} mb-4`} aria-label="Attendance pulse">
            <div className="flex flex-wrap items-start gap-8">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)] mb-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--cf-volt)]" aria-hidden />
                  Health
                </p>
                <AttendanceRing value={health} />
              </div>
              <div className="min-w-0 flex-1 basis-64">
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)] mb-2">Trend · last {trend.length} sessions</p>
                {trend.length > 1 ? <Sparkline points={trend} width={460} height={96} /> : <p className="text-sm text-[var(--cf-ink-mute)]">Not enough sessions for a trend yet.</p>}
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)] mt-4 mb-2">Activity matrix · last 4 weeks</p>
                <Heatmap weeks={weeks} />
              </div>
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-4">
            <section className={GLASS} aria-label="Course comparison">
              <h2 className="font-display font-semibold mb-3">Course comparison</h2>
              <ul className="space-y-3">
                {byCourse.map((c) => (
                  <li key={c.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium truncate">{c.name}</span>
                      <span className="text-xs text-[var(--cf-ink-mute)] tabular-nums">{c.pct}% · {c.n} records</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden" role="img" aria-label={`${c.name} ${c.pct} percent`}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${c.pct}%`, background: c.pct >= 75 ? 'var(--cf-chart-1)' : c.pct >= 60 ? 'var(--cf-chart-5)' : 'var(--cf-chart-6)' }} />
                    </div>
                  </li>
                ))}
              </ul>
              {health < 75 && (
                  <p className="rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-warning)]/10 px-3 py-2.5 mt-4 text-xs font-semibold">
                  Projected risk: below the 75% threshold. Attend every upcoming class to recover.
                </p>
              )}
            </section>
            <section className={GLASS} aria-label="Recent sessions">
              <h2 className="font-display font-semibold mb-3">Recent sessions</h2>
              <ul className="divide-y divide-[var(--cf-line)]">
                {mine.slice(-6).reverse().map((s) => (
                  <li key={s._id} className="py-2.5 flex items-center gap-2 text-sm">
                    <span className="font-medium tabular-nums">{fmt(s.date)}</span>
                    <span className="text-[var(--cf-ink-mute)] truncate">
                      {s.subject?.name || ''} · Period {s.period}
                      {s.markedBy?.name ? ` · marked by ${s.markedBy.name}` : ''}
                    </span>
                    <span className="ml-auto flex gap-1">
                      {(s.records || []).slice(0, 4).map((r, i) => (
                        <span key={i} className={statusBadge(r.status)}>{r.status}</span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}

      <Modal open={showMark} onClose={() => setShowMark(false)} title="Mark attendance" wide>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className={labelClass} htmlFor="att-subject">Subject</label>
            <select id="att-subject" className={selectClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="att-period">Period</label>
            <input id="att-period" className={inputClass} value={period} onChange={(e) => setPeriod(e.target.value)} inputMode="numeric" />
          </div>
          <div className="flex items-end gap-1.5">
            {STATUSES.map((s) => (
              <button key={s} type="button" onClick={() => markAll(s)} className={btnClass('outline', 'small')}>{s}</button>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <label className={labelClass} htmlFor="att-student-search">Find student</label>
          <input
            id="att-student-search"
            className={inputClass}
            placeholder="Search enrolled students…"
            aria-label="Search enrolled students"
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
          />
        </div>
        <ul className="max-h-64 overflow-y-auto divide-y divide-[var(--cf-line)] rounded-[14px] border border-[var(--cf-line)]">
          {visibleStudents.map((s) => (
            <li key={s._id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="flex-1 truncate font-medium">{s.name}</span>
              <div className="flex gap-1" role="radiogroup" aria-label={`Attendance for ${s.name}`}>
                {STATUSES.map((st, sti) => {
                  const checked = (marks[s._id] || 'present') === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      tabIndex={checked ? 0 : -1}
                      onClick={() => setMarks((m) => ({ ...m, [s._id]: st }))}
                      onKeyDown={(e) => {
                        const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
                          : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
                        if (!dir) return;
                        e.preventDefault();
                        const next = STATUSES[(sti + dir + STATUSES.length) % STATUSES.length];
                        setMarks((m) => ({ ...m, [s._id]: next }));
                        document.querySelector(`[data-att-radio="${s._id}-${next}"]`)?.focus();
                      }}
                      data-att-radio={`${s._id}-${st}`}
                      className={cn2(checked)}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
          {markableStudents.length === 0 && <li className="px-3 py-6 text-center text-sm text-[var(--cf-ink-mute)]">No students enrolled in this subject&apos;s course.</li>}
          {markableStudents.length > 0 && visibleStudents.length === 0 && <li className="px-3 py-6 text-center text-sm text-[var(--cf-ink-mute)]">No students match this search.</li>}
        </ul>
        <button onClick={saveSession} disabled={saving} className={btnClass('success', 'medium') + ' w-full mt-4'}>
          {saving ? 'Saving…' : `Save session · ${markableStudents.length} students`}
        </button>
      </Modal>
    </div>
  );
}

const isTaughtBy = (subject, userId) =>
  userId != null && String(subject?.faculty?._id || subject?.faculty || '') === String(userId);

const cn2 = (active) =>
  `rounded-full px-2.5 min-h-9 text-[11px] font-bold capitalize border transition ${active ? 'bg-[var(--cf-accent-strong)] text-white border-transparent dark:bg-[var(--cf-accent)] dark:text-[#100D0B]' : 'bg-[var(--cf-surface-2)] text-[var(--cf-ink-soft)] border-[var(--cf-line)]'}`;
