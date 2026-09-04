// Campus Intelligence Center: every insight answers what changed, why it
// matters, and what should happen next — with evidence beside it.
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import { Badge, Card, EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';
import { staggerChild, staggerParent } from '../../system/motion';
import { btnClass, labelClass, selectClass } from '../../system/tokens';

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

// Heuristic signal extraction: structured output wins; free text falls back to summary.
const signalsOf = (report) => {
  const out = report.output || {};
  if (Array.isArray(out.insights) && out.insights.length) {
    return out.insights.map((i) => ({
      what: i.what || i.title || 'Signal',
      why: i.why || i.reason || '',
      next: i.next || i.action || '',
      evidence: i.evidence || ''
    }));
  }
  if (out.summary) return [{ what: out.summary, why: '', next: '', evidence: '' }];
  return [];
};

export default function AIReports() {
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(null);
  const { register, handleSubmit } = useForm();

  const fetchReports = async () => {
    try {
      const { data } = await api.get('/ai-reports');
      const list = data.data || [];
      setReports(list);
      if (list[0] && !selected) setSelected(list[0]);
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
    api.get('/users').then(({ data }) => setStudents((data.data || []).filter((u) => u.role === 'student'))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGenerate = async ({ studentId }) => {
    if (!studentId) return toast.error('Select a student first');
    setGenerating(true);
    try {
      const { data } = await api.post('/ai-reports/generate', { studentId });
      const created = data.data || data;
      toast.success(created?.provider === 'none' ? 'Snapshot stored — AI provider not configured' : 'Report generated');
      await fetchReports();
      if (created?._id) setSelected(created);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const unconfigured = useMemo(() => reports.some((r) => r.provider === 'none'), [reports]);
  const signals = useMemo(() => (selected ? signalsOf(selected) : []), [selected]);

  return (
    <div>
      <PageHeader title="Campus Intelligence" subtitle="What changed, why it matters, and what happens next — with evidence." />

      {unconfigured && (
        <p className="mb-4 flex items-start gap-2 text-xs px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-200">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          The AI provider isn’t configured on the server, so reports are stored snapshots rather than live insights. Set OPENAI_API_KEY to activate full analysis.
        </p>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <Card>
            <form onSubmit={handleSubmit(onGenerate)} className="space-y-3">
              <div>
                <label htmlFor="studentId" className={labelClass}>Analyze student</label>
                <select id="studentId" className={selectClass} {...register('studentId')}>
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}{s.profile?.rollNumber ? ` (${s.profile.rollNumber})` : ''}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={generating} className={btnClass('glow', 'medium') + ' w-full'}>
                <Sparkles size={15} /> {generating ? 'Analyzing…' : 'Generate insight'}
              </button>
            </form>
          </Card>

          <Card className="p-2">
            <p className="px-2 pt-1 pb-2 text-xs font-semibold uppercase tracking-wider text-[var(--cf-ink-mute)]">Reports · {reports.length}</p>
            {loading ? <LoadingState /> : reports.length === 0 ? (
              <EmptyState title="No reports yet" hint="Generate the first insight above." />
            ) : (
              <ul className="max-h-96 overflow-y-auto space-y-1">
                {reports.map((r) => (
                  <li key={r._id}>
                    <button
                      onClick={() => setSelected(r)}
                      aria-current={selected?._id === r._id}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition ${selected?._id === r._id ? 'bg-primary-50 dark:bg-primary-500/15' : 'hover:bg-black/[.03] dark:hover:bg-white/[.05]'}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{r.student?.name || 'Student'}</span>
                        <Badge status={r.provider === 'none' ? 'draft' : 'open'}>{r.provider || 'none'}</Badge>
                      </span>
                      <span className="block text-[11px] text-[var(--cf-ink-mute)] mt-0.5">{fmt(r.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <Card><EmptyState title="Select a report" hint="Insights with evidence will appear here." /></Card>
          ) : (
            <motion.div {...staggerParent(0.05)} initial="initial" animate="animate" key={selected._id} className="space-y-3">
              <motion.div variants={staggerChild}>
                <Card>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="font-semibold flex items-center gap-1.5"><TrendingUp size={16} className="text-primary-500" /> {selected.student?.name}</h2>
                    <span className="text-[11px] text-[var(--cf-ink-mute)]">{fmt(selected.createdAt)}</span>
                  </div>
                  {selected.dataSnapshotHash && (
                    <p className="text-[11px] text-[var(--cf-ink-mute)]">Grounded snapshot <code className="px-1 rounded bg-black/[.05] dark:bg-white/10">{String(selected.dataSnapshotHash).slice(0, 12)}…</code></p>
                  )}
                </Card>
              </motion.div>
              {signals.length === 0 && (
                <Card><EmptyState title="Empty analysis" hint="The report carries no readable output." /></Card>
              )}
              {signals.map((s, i) => (
                <motion.article key={i} variants={staggerChild} className="rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-line)] shadow-1 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-300">What changed</p>
                  <p className="font-semibold mt-0.5">{s.what}</p>
                  {s.why && (<><p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--cf-ink-mute)]">Why it matters</p><p className="text-sm text-[var(--cf-ink-soft)] mt-0.5">{s.why}</p></>)}
                  {s.next && (<><p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--cf-ink-mute)]">What should happen next</p><p className="text-sm text-[var(--cf-ink-soft)] mt-0.5">{s.next}</p></>)}
                  {s.evidence && (
                    <p className="mt-3 text-xs rounded-xl bg-black/[.03] dark:bg-white/[.05] border border-[var(--cf-line)] p-3">
                      <span className="font-semibold">Evidence: </span>{s.evidence}
                    </p>
                  )}
                </motion.article>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
