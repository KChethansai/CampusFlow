// Attendance: health-first experience — ring, trend, heatmap, course comparison.
// Faculty: mark attendance (POST /attendance).
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, Card, EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';
import { Modal } from '../../components/ui/Modal';
import { AttendanceRing, Heatmap, Sparkline } from '../../components/data/views';
import { btnClass, inputClass, labelClass, selectClass, statusBadge } from '../../system/tokens';

const STATUSES = ['present', 'absent', 'late', 'od'];

export default function Attendance() {
  const { user } = useAuth();
  const isFaculty = user?.role === 'faculty';
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMark, setShowMark] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [period, setPeriod] = useState('1');
  const [marks, setMarks] = useState({});

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/attendance');
      setSessions(data.data || []);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
    if (isFaculty) {
      api.get('/subjects').then(({ data }) => {
        const list = data.data || [];
        setSubjects(list);
        if (list[0]) setSubjectId(list[0]._id);
      }).catch(() => {});
      api.get('/users').then(({ data }) => setStudents((data.data || []).filter((u) => u.role === 'student'))).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFaculty]);

  const mine = useMemo(() => {
    if (!isFaculty && user?._id) {
      // Sessions carry full records; filter to own rows for the personal view.
      return sessions.map((s) => ({
        ...s,
        records: (s.records || []).filter((r) => String(r.student?._id || r.student) === String(user._id))
      })).filter((s) => s.records.length);
    }
    return sessions;
  }, [sessions, isFaculty, user?._id]);

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
    students.forEach((s) => { next[s._id] = status; });
    setMarks(next);
  };

  const saveSession = async () => {
    if (!subjectId) return toast.error('Select a subject');
    const records = students.map((s) => ({ student: s._id, status: marks[s._id] || 'present' }));
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
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle={health == null ? 'No sessions recorded yet.' : `${recs.length} records · ${missed} missed classes`}
        actions={isFaculty && (
          <button onClick={() => setShowMark(true)} className={btnClass('primary', 'medium')}>
            <Plus size={15} /> Mark attendance
          </button>
        )}
      />

      {loading ? <LoadingState /> : health == null ? (
        <Card><EmptyState title="No attendance yet" hint={isFaculty ? 'Mark your first session to activate this view.' : 'Your attendance will appear here once classes are marked.'} /></Card>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 gap-4 mb-4">
            <Card className="lg:col-span-1"><AttendanceRing value={health} /></Card>
            <Card className="lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cf-ink-mute)] mb-2">Trend · last {trend.length} sessions</p>
              {trend.length > 1 ? <Sparkline points={trend} width={460} height={96} /> : <p className="text-sm text-[var(--cf-ink-mute)]">Not enough sessions for a trend yet.</p>}
              <div className="mt-4"><Heatmap weeks={weeks} /></div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <h2 className="font-semibold mb-3">Course comparison</h2>
              <ul className="space-y-3">
                {byCourse.map((c) => (
                  <li key={c.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium truncate">{c.name}</span>
                      <span className="text-xs text-[var(--cf-ink-mute)]">{c.pct}% · {c.n} records</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden" role="img" aria-label={`${c.name} ${c.pct} percent`}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${c.pct}%`, background: c.pct >= 75 ? '#16a34a' : c.pct >= 60 ? '#d97706' : '#dc2626' }} />
                    </div>
                  </li>
                ))}
              </ul>
              {health < 75 && (
                <p className="mt-4 text-xs px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-200">
                  Projected risk: below the 75% threshold. Attend every upcoming class to recover.
                </p>
              )}
            </Card>
            <Card>
              <h2 className="font-semibold mb-3">Recent sessions</h2>
              <ul className="divide-y divide-[var(--cf-line)]">
                {mine.slice(-6).reverse().map((s) => (
                  <li key={s._id} className="py-2.5 flex items-center gap-2 text-sm">
                    <span className="font-medium">{fmt(s.date)}</span>
                    <span className="text-[var(--cf-ink-mute)] truncate">{s.subject?.name || ''} · Period {s.period}</span>
                    <span className="ml-auto flex gap-1">
                      {(s.records || []).slice(0, 4).map((r, i) => (
                        <span key={i} className={statusBadge(r.status)}>{r.status}</span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
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
        <ul className="max-h-64 overflow-y-auto divide-y divide-[var(--cf-line)] rounded-xl border border-[var(--cf-line)]">
          {students.map((s) => (
            <li key={s._id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="flex-1 truncate font-medium">{s.name}</span>
              <div className="flex gap-1" role="radiogroup" aria-label={`Attendance for ${s.name}`}>
                {STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    role="radio"
                    aria-checked={(marks[s._id] || 'present') === st}
                    onClick={() => setMarks((m) => ({ ...m, [s._id]: st }))}
                    className={`px-2 py-1 rounded-full text-[11px] font-medium capitalize transition ${(marks[s._id] || 'present') === st ? 'bg-primary-600 text-white' : 'bg-black/[.05] dark:bg-white/10 text-[var(--cf-ink-soft)]'}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </li>
          ))}
          {students.length === 0 && <li className="px-3 py-6 text-center text-sm text-[var(--cf-ink-mute)]">No students found.</li>}
        </ul>
        <button onClick={saveSession} className={btnClass('success', 'medium') + ' w-full mt-4'}>
          Save session · {students.length} students
        </button>
      </Modal>
    </div>
  );
}
