// Placement Mission Control: horizontal pipeline tracker + drive cards +
// conversion analytics. Stage PATCH logic + normalizeStage untouched.
// Same endpoints as before; eligibility rendered verbatim (dept limits are advisory).
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';
import { Modal } from '../../components/ui/Modal';
import { PipelineLabels, PipelineStages, WorkflowTimeline } from '../../components/data/views';
import { AnalyticsPanel, LazyChart, PillTabs, ActivityStream } from '../../components/campus/regions';
import { DriveCard, PipelineFunnel, PipelineRow } from '../../components/campus/placement';
import { PIPELINE_STAGES, normalizeStage } from '../../system/tokens';
import { staggerChild, staggerParent } from '../../system/motion';
import { btnClass, cn, inputClass, labelClass, selectClass } from '../../system/tokens';

const TrendChart = lazy(() =>
  import('../../components/data/TrendChart')
    .then((m) => ({ default: m.TrendChart || m.default }))
    .catch(() => ({ default: () => null }))
);
// TrendChart stays lazy-loaded for the conversion panel fallback chain.
void TrendChart;

const JOB_TYPES = ['full-time', 'part-time', 'internship', 'contract'];
const STAGES = [...PIPELINE_STAGES.flatMap((s) => (s === 'interview' ? ['interview_1', 'interview_2', 'hr_round'] : [s])), 'rejected'];

const GLASS = 'cf-glass rounded-[24px] border border-[var(--cf-line)] p-5';
const LIFT = 'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export default function Placement() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isStaff = ['placement_officer', 'college_admin', 'super_admin'].includes(user?.role);

  const [tab, setTab] = useState('board');
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [detail, setDetail] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [appDetail, setAppDetail] = useState(null);
  const [showCompany, setShowCompany] = useState(false);
  const [showDrive, setShowDrive] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const companyForm = useForm({ defaultValues: { name: '', website: '', industry: '', hrContact: '' } });
  const driveForm = useForm({
    defaultValues: { company: '', role: '', jobType: 'full-time', packageLPA: '', location: '', minCGPA: '', maxBacklogs: '', graduationYear: '', applicationDeadline: '', status: 'active' }
  });

  const fetchAll = useCallback(async () => {
    const [d, c, a] = await Promise.allSettled([api.get('/job-drives'), api.get('/companies'), api.get('/job-applications')]);
    if (d.status === 'fulfilled') setDrives(d.value.data.data || []);
    if (c.status === 'fulfilled') setCompanies(c.value.data.data || []);
    if (a.status === 'fulfilled') setApplications(a.value.data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openDetail = async (drive) => {
    setDetail(drive);
    setEligibility(null);
    try {
      const { data } = await api.get(`/job-applications/drives/${drive._id}/eligibility`);
      setEligibility(data.data || data);
    } catch { /* advisory only */ }
  };

  const apply = async (driveId) => {
    setBusy(`apply-${driveId}`);
    try {
      const { data } = await api.post(`/job-applications/drives/${driveId}/apply`);
      const elig = data.eligibility || data.data?.eligibility;
      if (elig && elig.eligible === false) {
        toast(`Applied with warnings: ${(elig.failures || []).join('; ') || 'check eligibility'}`, { icon: '!' });
      } else {
        toast.success('Application submitted');
      }
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setBusy(null);
    }
  };

  const updateStage = async (applicationId, driveId, stage) => {
    setBusy(`stage-${applicationId}`);
    try {
      await api.patch(`/job-applications/drives/${driveId}/applications/${applicationId}`, { stage });
      toast.success(`Stage set to ${stage.replace(/_/g, ' ')}`);
      fetchAll();
      setAppDetail((prev) => (prev && prev._id === applicationId ? { ...prev, stage } : prev));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stage');
    } finally {
      setBusy(null);
    }
  };

  const appliedDriveIds = useMemo(() => new Set(applications.map((a) => String(a.drive?._id || a.drive))), [applications]);

  const funnel = useMemo(() => {
    const counts = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, 0]));
    applications.forEach((a) => {
      if (a.stage === 'rejected') return;
      const n = normalizeStage(a.stage);
      if (n in counts) counts[n]++;
    });
    return counts;
  }, [applications]);

  // Conversion analytics: cumulative applications + wins over time (real createdAt).
  const conversionRows = useMemo(() => {
    const sorted = [...applications].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    if (!sorted.length) return [];
    const N = 8;
    const buckets = Array.from({ length: N }, (_, i) => ({ bucket: `P${i + 1}`, applications: 0, wins: 0 }));
    let acc = 0;
    let wins = 0;
    sorted.forEach((a, i) => {
      const b = Math.min(N - 1, Math.floor((i / sorted.length) * N));
      acc++;
      if (['offer', 'placed'].includes(a.stage)) wins++;
      buckets[b] = { ...buckets[b], applications: acc, wins };
    });
    let lastA = 0;
    let lastW = 0;
    return buckets.map((r) => {
      lastA = Math.max(lastA, r.applications);
      lastW = Math.max(lastW, r.wins);
      return { bucket: r.bucket, applications: lastA, wins: lastW };
    });
  }, [applications]);

  const maxStage = useMemo(() => Math.max(1, ...PIPELINE_STAGES.map((s) => funnel[s])), [funnel]);

  const buildDrivePayload = (form) => ({
    company: form.company,
    role: form.role,
    jobType: form.jobType,
    packageLPA: form.packageLPA ? Number(form.packageLPA) : undefined,
    location: form.location,
    applicationDeadline: form.applicationDeadline || undefined,
    status: form.status,
    eligibility: {
      minCGPA: form.minCGPA ? Number(form.minCGPA) : undefined,
      maxBacklogs: form.maxBacklogs ? Number(form.maxBacklogs) : undefined,
      graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined
    }
  });

  const onCreateCompany = async (form) => {
    try {
      if (editingCompany) {
        await api.patch(`/companies/${editingCompany._id}`, form);
        toast.success('Company updated');
      } else {
        await api.post('/companies', form);
        toast.success('Company added');
      }
      setShowCompany(false);
      setEditingCompany(null);
      companyForm.reset();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save company');
    }
  };

  const startEditCompany = (c) => {
    setEditingCompany(c);
    companyForm.reset({ name: c.name || '', website: c.website || '', industry: c.industry || '', hrContact: c.hrContact || '' });
    setShowCompany(true);
  };

  const onCreateDrive = async (form) => {
    try {
      if (editingDrive) {
        await api.patch(`/job-drives/${editingDrive._id}`, buildDrivePayload(form));
        toast.success('Drive updated');
      } else {
        await api.post('/job-drives', buildDrivePayload(form));
        toast.success('Job drive created');
      }
      setShowDrive(false);
      setEditingDrive(null);
      driveForm.reset();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save drive');
    }
  };

  const startEditDrive = (d) => {
    setEditingDrive(d);
    setDetail(null);
    driveForm.reset({
      company: d.company?._id || d.company || '',
      role: d.role || '',
      jobType: d.jobType || 'full-time',
      packageLPA: d.packageLPA ?? '',
      location: d.location || '',
      minCGPA: d.eligibility?.minCGPA ?? '',
      maxBacklogs: d.eligibility?.maxBacklogs ?? '',
      graduationYear: d.eligibility?.graduationYear ?? '',
      applicationDeadline: d.applicationDeadline ? new Date(d.applicationDeadline).toISOString().slice(0, 10) : '',
      status: d.status || 'active'
    });
    setShowDrive(true);
  };

  const askDelete = (kind, row) => setConfirmDelete({ kind, row });

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { kind, row } = confirmDelete;
    setBusy(`del-${row._id}`);
    try {
      await api.delete(kind === 'drive' ? `/job-drives/${row._id}` : `/companies/${row._id}`);
      toast.success(`${kind === 'drive' ? 'Drive' : 'Company'} deleted`);
      if (kind === 'drive' && detail?._id === row._id) setDetail(null);
      setConfirmDelete(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setBusy(null);
    }
  };

  const appTimeline = (app) => {
    const history = app.history || [];
    const seen = new Set(history.map((h) => h.stage));
    const steps = [...PIPELINE_STAGES.map((s) => ({
      label: s,
      done: PIPELINE_STAGES.indexOf(normalizeStage(app.stage)) > PIPELINE_STAGES.indexOf(s),
      active: normalizeStage(app.stage) === s,
      note: history.find((h) => normalizeStage(h.stage) === s)?.remarks,
      at: history.find((h) => normalizeStage(h.stage) === s)?.at ? fmtDT(history.find((h) => normalizeStage(h.stage) === s).at) : ''
    }))];
    if (!seen.has('applied') && app.createdAt) {
      steps[0] = { ...steps[0], at: steps[0].at || fmtDT(app.createdAt) };
    }
    if (app.stage === 'rejected') {
      steps.push({ label: 'rejected', done: false, active: true, note: 'Application closed' });
    }
    return steps;
  };

  const TABS = [
    { key: 'board', label: isStudent ? 'My journey' : 'Pipeline' },
    { key: 'market', label: 'Marketplace' },
    { key: 'apps', label: isStudent ? 'My applications' : 'Applicants' },
    ...(isStaff ? [{ key: 'companies', label: 'Companies' }] : [])
  ];

  return (
    <div>
      <PageHeader
        title="Placements"
        subtitle="Mission control — from first application to signed offer."
        actions={isStaff && (
          <>
            <button onClick={() => setShowCompany(true)} className={btnClass('outline', 'medium')}><Plus size={15} /> Company</button>
            <button onClick={() => setShowDrive(true)} className={btnClass('primary', 'medium')}><Plus size={15} /> Drive</button>
          </>
        )}
      />

      <div className="flex gap-1.5 mb-4" role="tablist" aria-label="Placement views">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={cn('rounded-full px-4 py-2 text-xs font-bold border transition',
              tab === t.key
                ? 'bg-[#A94727] text-white border-transparent'
                : 'bg-[var(--cf-surface)] text-[var(--cf-ink-soft)] border-[var(--cf-line)] hover:border-[#D86D3E]/50')}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : (
        <>
          {tab === 'board' && (
            <div className="space-y-4">
              {/* Horizontal pipeline tracker — real counts */}
              <section className={GLASS} aria-label="Pipeline tracker">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h2 className="font-display font-semibold">Applied → Shortlisted → Assessment → Interview → Offer → Placed</h2>
                  <span className="rounded-full bg-[#D86D3E]/10 text-[#D86D3E] px-2.5 py-0.5 text-[11px] font-bold tabular-nums">{applications.length} live</span>
                </div>
                <p className="text-xs text-[var(--cf-ink-mute)] mb-5">{applications.length} applications in motion.</p>
                <div className="flex items-start" role="img" aria-label={`Pipeline counts: ${PIPELINE_STAGES.map((s) => `${s} ${funnel[s]}`).join(', ')}`}>
                  {PIPELINE_STAGES.map((s, i) => (
                    <div key={s} className="flex-1 min-w-0 flex items-start">
                      <div className="flex-1 min-w-0 text-center">
                        <span
                          className="mx-auto grid place-items-center w-11 h-11 rounded-full border text-sm font-bold tabular-nums"
                          style={funnel[s]
                            ? { background: '#D86D3E', color: '#fff', borderColor: 'transparent' }
                            : { background: 'var(--cf-surface-2)', color: 'var(--cf-ink-mute)', borderColor: 'var(--cf-line)' }}
                        >
                          {funnel[s]}
                        </span>
                        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wide truncate text-[var(--cf-ink-mute)]">{s}</p>
                      </div>
                      {i < PIPELINE_STAGES.length - 1 && (
                        <span className="mt-[22px] h-px flex-1 min-w-2 bg-[var(--cf-line)]" aria-hidden />
                      )}
                    </div>
                  ))}
                </div>
                <PipelineLabels current={applications[0]?.stage || 'applied'} />
              </section>

              {/* Conversion analytics */}
              {conversionRows.length > 0 && (
                <section className={GLASS} aria-label="Conversion analytics">
                  <h2 className="font-display font-semibold mb-1">Conversion analytics</h2>
                  <p className="text-xs text-[var(--cf-ink-mute)] mb-3">Cumulative applications vs wins.</p>
                  <Suspense fallback={<p className="text-sm text-[var(--cf-ink-mute)]">Loading chart…</p>}>
                    <TrendChart
                      data={conversionRows}
                      xKey="bucket"
                      lines={[{ key: 'applications', color: '#D86D3E' }, { key: 'wins', color: '#A77B68' }]}
                      height={180}
                    />
                  </Suspense>
                </section>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {applications.slice(0, 6).map((a) => (
                  <button key={a._id} onClick={() => setAppDetail(a)} className={`${GLASS} ${LIFT} text-left`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold truncate">{a.drive?.role || 'Drive'} · {a.drive?.company?.name || ''}</p>
                      <Badge status={a.stage || 'applied'}>{(a.stage || 'applied').replace(/_/g, ' ')}</Badge>
                    </div>
                    <PipelineStages current={a.stage || 'applied'} compact />
                  </button>
                ))}
                {applications.length === 0 && (
                  <div className={`${GLASS} md:col-span-2`}><EmptyState editorial title="No applications yet" hint="The marketplace is waiting." action={<button onClick={() => setTab('market')} className={btnClass('primary', 'small')}>Browse drives</button>} /></div>
                )}
              </div>
            </div>
          )}

          {tab === 'market' && (
            <motion.div {...staggerParent(0.05)} initial="initial" animate="animate" className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {drives.map((d) => {
                const applied = appliedDriveIds.has(String(d._id));
                return (
                  <motion.article key={d._id} variants={staggerChild} className={`${GLASS} ${LIFT}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="grid place-items-center w-10 h-10 shrink-0 rounded-[14px] bg-[#D86D3E]/10 text-[#D86D3E]" aria-hidden>
                        <Building2 size={19} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-tight truncate">{d.role}</h3>
                        <p className="text-xs text-[var(--cf-ink-mute)] truncate">{d.company?.name}</p>
                      </div>
                      <span className="ml-auto"><Badge status={d.status || 'active'}>{d.status || 'active'}</Badge></span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--cf-ink-mute)] mb-3">
                      {d.packageLPA && <span className="flex items-center gap-1 font-semibold text-[var(--cf-ink)]"><Wallet size={13} /> {d.packageLPA} LPA</span>}
                      {d.location && <span className="flex items-center gap-1"><MapPin size={13} /> {d.location}</span>}
                      {d.jobType && <span className="capitalize">{d.jobType}</span>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[var(--cf-ink-mute)]">Apply by {fmtDate(d.applicationDeadline)}</span>
                      <span className="flex gap-1.5">
                        <button onClick={() => openDetail(d)} className={btnClass('outline', 'small')}>Details</button>
                        {isStudent && !applied && d.status === 'active' && (
                          <button onClick={() => apply(d._id)} disabled={busy === `apply-${d._id}`} className={btnClass('primary', 'small')}>
                            {busy === `apply-${d._id}` ? 'Applying…' : 'Apply now'}
                          </button>
                        )}
                        {isStudent && applied && <Badge status="applied">Applied</Badge>}
                      </span>
                    </div>
                  </motion.article>
                );
              })}
              {drives.length === 0 && (
                <div className={`${GLASS} md:col-span-2 xl:col-span-3`}><EmptyState title="No drives posted" hint={isStaff ? 'Post the first drive to activate the board.' : 'Check back soon.'} /></div>
              )}
            </motion.div>
          )}

          {tab === 'apps' && (
            <section className={`${GLASS} !p-2 overflow-hidden`} aria-label="Applications">
              <ul className="divide-y divide-[var(--cf-line)]">
                {applications.map((a) => (
                  <li key={a._id}>
                    <button onClick={() => setAppDetail(a)} className="w-full text-left px-4 py-3.5 flex items-center gap-3 rounded-[14px] hover:bg-black/[.02] dark:hover:bg-white/[.03] transition">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium truncate">{a.student?.name || 'Applicant'} → {a.drive?.role || 'Drive'}</span>
                        <span className="block text-xs text-[var(--cf-ink-mute)]">{a.drive?.company?.name || ''}</span>
                      </span>
                      <Badge status={a.stage || 'applied'}>{(a.stage || 'applied').replace(/_/g, ' ')}</Badge>
                      <ArrowRight size={15} className="text-[var(--cf-ink-mute)]" />
                    </button>
                  </li>
                ))}
                {applications.length === 0 && <li><EmptyState title="No applications" hint="Applications will stream in here." /></li>}
              </ul>
            </section>
          )}

          {tab === 'companies' && isStaff && (
            <section className={`${GLASS} !p-2 overflow-hidden`} aria-label="Companies">
              <ul className="divide-y divide-[var(--cf-line)]">
                {companies.map((c) => (
                  <li key={c._id} className="px-4 py-3.5 flex items-center gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">{c.name}</span>
                      <span className="block text-xs text-[var(--cf-ink-mute)] truncate">{c.industry || ''}{c.website ? ` · ${c.website.replace(/^https?:\/\//, '')}` : ''}</span>
                    </span>
                    <button onClick={() => startEditCompany(c)} className={btnClass('outline', 'small')}>Edit</button>
                    <button onClick={() => askDelete('company', c)} className={btnClass('danger', 'small')}>Delete</button>
                  </li>
                ))}
                {companies.length === 0 && <li><EmptyState title="No companies yet" hint="Add the first hiring partner." /></li>}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Job detail */}
      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? `${detail.role} · ${detail.company?.name || ''}` : ''} wide>
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {detail.packageLPA && <span className="font-bold text-lg">{detail.packageLPA} LPA</span>}
              {detail.location && <span className="flex items-center gap-1 text-[var(--cf-ink-soft)]"><MapPin size={14} /> {detail.location}</span>}
              {detail.jobType && <Badge tone="bg-black/[.05] dark:bg-white/10 text-[var(--cf-ink-soft)]">{detail.jobType}</Badge>}
              <Badge status={detail.status || 'active'}>{detail.status || 'active'}</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/50 p-3.5">
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)] mb-1.5">Eligibility</p>
                <ul className="space-y-1 text-[var(--cf-ink-soft)]">
                  <li>Min CGPA: {detail.eligibility?.minCGPA ?? '—'}</li>
                  <li>Max backlogs: {detail.eligibility?.maxBacklogs ?? '—'}</li>
                  <li>Graduation: {detail.eligibility?.graduationYear ?? '—'}</li>
                </ul>
                {eligibility && (
                  <p className={cn('mt-2 text-xs font-medium', eligibility.eligible === false ? 'text-amber-600 dark:text-amber-300' : 'text-green-600 dark:text-green-400')}>
                    {eligibility.eligible === false
                      ? `Heads up: ${(eligibility.failures || []).join('; ') || 'you may not meet all criteria'} — you can still apply.`
                      : 'You meet the listed criteria.'}
                  </p>
                )}
              </div>
              <div className="rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/50 p-3.5">
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)] mb-1.5">Timeline</p>
                <p className="text-[var(--cf-ink-soft)]">Apply by {fmtDate(detail.applicationDeadline)}</p>
                <p className="text-xs text-[var(--cf-ink-mute)] mt-1">Process: applied → shortlisted → assessment → interview → offer → placed.</p>
              </div>
            </div>
            {isStudent && !appliedDriveIds.has(String(detail._id)) && detail.status === 'active' && (
              <button onClick={() => { apply(detail._id); }} disabled={busy === `apply-${detail._id}`} className={btnClass('glow', 'large') + ' w-full'}>
                {busy === `apply-${detail._id}` ? 'Applying…' : 'Apply now'}
              </button>
            )}
            {isStaff && (
              <div className="flex gap-2">
                <button onClick={() => startEditDrive(detail)} className={btnClass('outline', 'medium') + ' flex-1'}>Edit drive</button>
                <button onClick={() => askDelete('drive', detail)} className={btnClass('danger', 'medium') + ' flex-1'}>Delete</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Application detail */}
      <Modal open={Boolean(appDetail)} onClose={() => setAppDetail(null)} title={appDetail ? `${appDetail.student?.name || 'Application'} → ${appDetail.drive?.role || ''}` : ''}>
        {appDetail && (
          <div className="space-y-4">
            <PipelineLabels current={appDetail.stage || 'applied'} />
            <WorkflowTimeline steps={appTimeline(appDetail)} />
            {isStaff && appDetail.stage !== 'placed' && appDetail.stage !== 'rejected' && (
              <div>
                <label className="block mb-1.5 text-sm font-medium" htmlFor="stage-select">Move to stage</label>
                <select
                  id="stage-select"
                  className={selectClass}
                  value={appDetail.stage || 'applied'}
                  disabled={busy === `stage-${appDetail._id}`}
                  onChange={(e) => updateStage(appDetail._id, appDetail.drive?._id || appDetail.drive, e.target.value)}
                >
                  {STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Staff create/edit modals */}
      <Modal open={showCompany} onClose={() => { setShowCompany(false); setEditingCompany(null); companyForm.reset(); }} title={editingCompany ? 'Edit company' : 'Add company'}>
        <form onSubmit={companyForm.handleSubmit(onCreateCompany)} className="space-y-3">
          {['name', 'website', 'industry', 'hrContact'].map((f) => (
            <div key={f}>
              <label className={labelClass} htmlFor={`co-${f}`}>{f === 'hrContact' ? 'HR contact' : f[0].toUpperCase() + f.slice(1)}</label>
              <input id={`co-${f}`} className={inputClass} placeholder={f === 'website' ? 'https://example.com' : undefined} {...companyForm.register(f, { required: f === 'name' })} />
            </div>
          ))}
          <button type="submit" className={btnClass('success', 'medium') + ' w-full'}>{editingCompany ? 'Save changes' : 'Add company'}</button>
        </form>
      </Modal>

      <Modal open={showDrive} onClose={() => { setShowDrive(false); setEditingDrive(null); driveForm.reset(); }} title={editingDrive ? 'Edit drive' : 'Post drive'} wide>
        <form onSubmit={driveForm.handleSubmit(onCreateDrive)} className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="dr-company">Company</label>
            <select id="dr-company" className={selectClass} {...driveForm.register('company', { required: true })}>
              <option value="">Select company</option>
              {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="dr-role">Role</label>
            <input id="dr-role" className={inputClass} placeholder="SDE Intern" {...driveForm.register('role', { required: true })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="dr-type">Type</label>
            <select id="dr-type" className={selectClass} {...driveForm.register('jobType')}>
              {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="dr-pkg">Package (LPA)</label>
            <input id="dr-pkg" type="number" step="0.1" className={inputClass} {...driveForm.register('packageLPA')} />
          </div>
          <div>
            <label className={labelClass} htmlFor="dr-loc">Location</label>
            <input id="dr-loc" className={inputClass} {...driveForm.register('location')} />
          </div>
          <div>
            <label className={labelClass} htmlFor="dr-cgpa">Min CGPA</label>
            <input id="dr-cgpa" type="number" step="0.1" className={inputClass} {...driveForm.register('minCGPA')} />
          </div>
          <div>
            <label className={labelClass} htmlFor="dr-backlogs">Max backlogs</label>
            <input id="dr-backlogs" type="number" className={inputClass} {...driveForm.register('maxBacklogs')} />
          </div>
          <div>
            <label className={labelClass} htmlFor="dr-year">Graduation year</label>
            <input id="dr-year" type="number" className={inputClass} placeholder="2026" {...driveForm.register('graduationYear')} />
          </div>
          <div>
            <label className={labelClass} htmlFor="dr-status">Status</label>
            <select id="dr-status" className={selectClass} {...driveForm.register('status')}>
              {['active', 'closed', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="dr-deadline">Deadline</label>
            <input id="dr-deadline" type="date" className={inputClass} {...driveForm.register('applicationDeadline')} />
          </div>
          <button type="submit" className={btnClass('success', 'medium') + ' sm:col-span-2'}>{editingDrive ? 'Save changes' : 'Post drive'}</button>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title={`Delete ${confirmDelete?.kind === 'drive' ? 'drive' : 'company'}?`}>
        <p className="text-sm text-[var(--cf-ink-soft)]">
          {confirmDelete?.kind === 'drive'
            ? `“${confirmDelete?.row.role}” and its pipeline view will be removed. Applications already submitted are kept.`
            : `“${confirmDelete?.row.name}” will be removed from the directory.`}
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={() => setConfirmDelete(null)} className={btnClass('outline', 'medium') + ' flex-1'}>Keep</button>
          <button onClick={doDelete} disabled={busy === `del-${confirmDelete?.row._id}`} className={btnClass('danger', 'medium') + ' flex-1'}>
            {busy === `del-${confirmDelete?.row._id}` ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
