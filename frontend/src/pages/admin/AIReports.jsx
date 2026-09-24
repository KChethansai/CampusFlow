// Campus Intelligence Center — Intelligence Mode: dark glass cards,
// Obsidian Ember gradient accent border, confidence + evidence blocks.
// Endpoints preserved: GET /ai-reports, GET /users,
// POST /ai-reports/generate. Provider flag drives copy only. Real data only.
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { AlertTriangle, Printer, Sparkles, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import { Badge, EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';
import { staggerChild, staggerParent } from '../../system/motion';
import { btnClass, cn, labelClass, selectClass } from '../../system/tokens';

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

// Dark glass intelligence surfaces; Obsidian Ember gradient hairline on top.
const INTEL = 'rounded-[24px] border border-[var(--cf-line)] bg-[var(--cf-surface)] p-5 relative overflow-hidden text-[var(--cf-ink)]';
const GRADIENT_LINE = 'pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#D86D3E] via-[#F5B08A] to-[#E7A66D]';

// Heuristic signal extraction: structured output wins; free text falls back to summary.
const signalsOf = (report) => {
  const out = report.output || {};
  if (Array.isArray(out.insights) && out.insights.length) {
    return out.insights.map((i) => ({
      what: i.what || i.title || 'Signal',
      why: i.why || i.reason || '',
      next: i.next || i.action || '',
      evidence: i.evidence || '',
      confidence: i.confidence ?? null
    }));
  }
  if (out.summary) return [{ what: out.summary, why: '', next: '', evidence: '', confidence: null }];
  return [];
};

// Confidence is derived from provenance only: live provider + evidence > snapshot.
const confidenceOf = (report, signal) => {
  if (signal?.confidence != null) return signal.confidence;
  if (report.provider === 'none') return 'Snapshot — unranked';
  return signal?.evidence ? 'High — evidence-backed' : 'Medium — model read';
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

  const [streaming, setStreaming] = useState(''); // progressive chunks, not a spinner

  // Progressive delivery: POST generates (or cache-hits), then GET stream
  // renders the stored summary chunk-by-chunk via fetch reader (keeps
  // Authorization header auth — EventSource can't send headers).
  const streamInto = async (report) => {
    setSelected(report);
    setStreaming('');
    try {
      const token = JSON.parse(localStorage.getItem('cf_auth') || 'null')?.accessToken;
      const res = await fetch(`${api.defaults.baseURL}/ai-reports/${report._id}/stream`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error('no stream');
      const decoder = new TextDecoder();
      let buf = '';
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop();
        for (const part of parts) {
          const line = part.trim().replace(/^data:\s*/, '');
          if (!line) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.chunk) {
              acc += evt.chunk;
              setStreaming(acc); // progressive generation
            }
          } catch { /* partial frame — wait for more */ }
        }
      }
    } catch {
      setStreaming(''); // fall back to stored full text below
    }
  };

  const onGenerate = async ({ studentId }) => {
    if (!studentId) return toast.error('Select a student first');
    setGenerating(true);
    try {
      const { data } = await api.post('/ai-reports/generate', { studentId });
      const created = data.data || data;
      if (data.cached) toast.success('Served from cache — snapshot unchanged');
      else toast.success(created?.provider === 'none' ? 'Snapshot stored — AI provider not configured' : 'Report generated');
      await fetchReports();
      if (created?._id) await streamInto(created);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  // History diff: previous report for the same student (this month vs last).
  const previous = useMemo(() => {
    if (!selected) return null;
    const same = reports
      .filter((r) => String(r.student?._id || r.student) === String(selected.student?._id || selected.student)
        && String(r._id) !== String(selected._id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return same[0] || null;
  }, [reports, selected]);
  const [showDiff, setShowDiff] = useState(false);

  const unconfigured = useMemo(() => reports.some((r) => r.provider === 'none'), [reports]);
  // While streaming, render progressive chunks in place of the stored text.
  const effective = useMemo(() => (
    selected && streaming ? { ...selected, output: { ...(selected.output || {}), summary: streaming } } : selected
  ), [selected, streaming]);
  const signals = useMemo(() => (effective ? signalsOf(effective) : []), [effective]);

  return (
    <div className="print-report">
      <PageHeader title="Campus Intelligence" subtitle="What changed, why it matters, and what happens next — with evidence."
        actions={selected && <button type="button" onClick={() => window.print()} className={btnClass('outline', 'small') + ' print-hide'}><Printer size={14} aria-hidden /> Export / print</button>} />

      {unconfigured && (
        <p className="cf-glass rounded-[14px] border border-[var(--cf-line)] mb-4 flex items-start gap-2 px-4 py-3 text-xs font-semibold">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-[#FFBD4A]" aria-hidden />
          The AI provider isn’t configured on the server, so reports are stored snapshots rather than live insights. Set OPENAI_API_KEY to activate full analysis.
        </p>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          {/* Generator — Intelligence Mode dark glass */}
          <section className={INTEL} aria-label="Generate insight">
            <span className={GRADIENT_LINE} aria-hidden />
            <form onSubmit={handleSubmit(onGenerate)} className="space-y-3">
              <div>
                <label htmlFor="studentId" className={cn(labelClass, '!text-[var(--cf-ink-soft)]')}>Analyze student</label>
                <select id="studentId" className={cn(selectClass, '!bg-[var(--cf-surface-2)] !border-[var(--cf-line)] !text-[var(--cf-ink)]')} {...register('studentId')}>
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}{s.profile?.rollNumber ? ` (${s.profile.rollNumber})` : ''}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={generating} className={btnClass('glow', 'medium') + ' w-full'}>
                <Sparkles size={15} aria-hidden /> {generating ? 'Analyzing…' : 'Generate insight'}
              </button>
            </form>
          </section>

          <section className="cf-glass rounded-[24px] border border-[var(--cf-line)] p-2" aria-label="Reports">
            <p className="px-3 pt-2 pb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">Reports · {reports.length}</p>
            {loading ? <LoadingState /> : reports.length === 0 ? (
              <EmptyState title="No reports yet" hint="Generate the first insight above." />
            ) : (
              <ul className="max-h-96 overflow-y-auto space-y-1">
                {reports.map((r) => (
                  <li key={r._id}>
                    <button
                      onClick={() => { setSelected(r); setStreaming(''); setShowDiff(false); }}
                      aria-current={selected?._id === r._id}
                      className={cn('w-full text-left px-3 py-2.5 rounded-[14px] border transition',
                        selected?._id === r._id
                          ? 'border-[#D86D3E]/60 bg-[#D86D3E]/10'
                          : 'border-transparent hover:bg-black/[.03] dark:hover:bg-white/[.05]')}
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
          </section>
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <div className="cf-glass rounded-[24px] border border-[var(--cf-line)] p-5">
              <EmptyState title="Select a report" hint="Insights with evidence will appear here." />
            </div>
          ) : (
            <motion.div {...staggerParent(0.05)} initial="initial" animate="animate" key={selected._id} className="space-y-3">
              <motion.div variants={staggerChild}>
                <section className={INTEL} aria-label="Report header">
                  <span className={GRADIENT_LINE} aria-hidden />
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="font-display font-semibold flex items-center gap-1.5">
                      <TrendingUp size={16} className="text-[#E7A66D]" aria-hidden /> {selected.student?.name}
                    </h2>
                    <span className="text-[11px] text-[var(--cf-ink-mute)]">{fmt(selected.createdAt)}</span>
                  </div>
                  {selected.dataSnapshotHash && (
                    <p className="text-[11px] text-[var(--cf-ink-mute)]">Grounded snapshot <code className="px-1 rounded bg-[var(--cf-surface-2)] border border-[var(--cf-line)]">{String(selected.dataSnapshotHash).slice(0, 12)}…</code></p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest bg-gradient-to-r from-[#D86D3E] to-[#B6532B] text-white">
                      Provider: {selected.provider || 'none'}
                    </span>
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest border border-[var(--cf-line)] text-[var(--cf-ink-soft)]">
                      {selected.provider === 'none' ? 'Confidence: snapshot' : 'Confidence: ranked per signal'}
                    </span>
                    {previous && (
                      <button
                        type="button"
                        onClick={() => setShowDiff((v) => !v)}
                        aria-expanded={showDiff}
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest border border-[#E7A66D]/50 text-[#E7A66D] hover:bg-[#E7A66D]/10 transition"
                      >
                        {showDiff ? 'Hide previous' : `Compare vs ${fmt(previous.createdAt)}`}
                      </button>
                    )}
                  </div>
                  {showDiff && previous && (
                    <div className="mt-3 rounded-[14px] bg-[var(--cf-surface-2)] border border-[var(--cf-line)] p-3" aria-label="Previous report comparison">
                      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">
                        Previous · {fmt(previous.createdAt)} · snapshot <code className="px-1 rounded bg-[var(--cf-surface)] border border-[var(--cf-line)]">{String(previous.dataSnapshotHash || '').slice(0, 12)}…</code>
                      </p>
                      <p className="text-sm text-[var(--cf-ink-soft)] mt-1 whitespace-pre-wrap">{previous.output?.summary || '—'}</p>
                    </div>
                  )}
                </section>
              </motion.div>
              {signals.length === 0 && (
                <div className="cf-glass rounded-[24px] border border-[var(--cf-line)] p-5">
                  <EmptyState title="Empty analysis" hint="The report carries no readable output." />
                </div>
              )}
              {signals.map((s, i) => (
                <motion.article key={i} variants={staggerChild} className={INTEL}>
                  <span className={GRADIENT_LINE} aria-hidden />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#E7A66D]">What changed</p>
                      <p className="font-semibold mt-0.5">{s.what}</p>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold border border-[var(--cf-line)] text-[var(--cf-ink-soft)]">
                      {confidenceOf(selected, s)}
                    </span>
                  </div>
                  {s.why && (<><p className="mt-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">Why it matters</p><p className="text-sm text-[var(--cf-ink-soft)] mt-0.5">{s.why}</p></>)}
                  {s.next && (<><p className="mt-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">What should happen next</p><p className="text-sm text-[var(--cf-ink-soft)] mt-0.5">{s.next}</p></>)}
                  {s.evidence && (
                    <p className="mt-3 text-xs rounded-[14px] bg-[var(--cf-surface-2)] border border-[var(--cf-line)] p-3 text-[var(--cf-ink-soft)]">
                      <span className="font-semibold text-[#E7A66D]">Evidence: </span>{s.evidence}
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
