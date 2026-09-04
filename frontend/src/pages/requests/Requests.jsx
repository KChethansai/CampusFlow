// Requests as workflow objects: requester, category, stage, next action + timeline.
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Badge, Card, EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';
import { WorkflowTimeline } from '../../components/data/views';
import { btnClass, cn, inputClass, selectClass } from '../../system/tokens';

const REQUEST_TYPES = ['leave', 'bonafide', 'revaluation', 'other'];
const FLOW = ['pending', 'in_review', 'approved'];

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

const timelineFor = (r) => {
  const events = r.timeline || [];
  const order = r.status === 'rejected' ? ['pending', 'in_review', 'rejected'] : FLOW;
  return order.map((s) => {
    const ev = [...events].reverse().find((e) => e.status === s);
    const reached = order.indexOf(r.status) >= order.indexOf(s) || (r.status === 'approved' && s !== 'rejected');
    return {
      label: s.replace(/_/g, ' '),
      done: r.status === 'approved' || order.indexOf(r.status) > order.indexOf(s),
      active: r.status === s,
      note: ev?.remarks,
      at: ev?.at ? fmt(ev.at) : (reached && s === 'pending' && r.createdAt ? fmt(r.createdAt) : '')
    };
  });
};

export default function Requests() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const canReview = !isStudent;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('All');
  const [openId, setOpenId] = useState(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { type: 'leave', title: '', description: '' } });

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/requests');
      setRequests(data.data || []);
    } catch {
      toast.error('Failed to load requests');
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const visible = useMemo(
    () => requests.filter((r) => filter === 'All' || r.status === filter || (filter === 'Open' && ['pending', 'in_review'].includes(r.status))),
    [requests, filter]
  );

  const onCreate = async (form) => {
    try {
      await api.post('/requests', form);
      toast.success('Request submitted');
      setShowForm(false);
      reset();
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/requests/${id}/status`, { status });
      toast.success(`Request ${status.replace(/_/g, ' ')}`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div>
      <PageHeader
        title="Requests"
        subtitle={`${requests.filter((r) => ['pending', 'in_review'].includes(r.status)).length} open · ${requests.length} total`}
        actions={isStudent && (
          <button onClick={() => setShowForm((v) => !v)} className={btnClass(showForm ? 'secondary' : 'primary', 'medium')}>
            <Plus size={15} /> New request
          </button>
        )}
      />

      <div className="flex gap-1.5 mb-4 overflow-x-auto" role="tablist" aria-label="Request filters">
        {['All', 'Open', 'pending', 'in_review', 'approved', 'rejected'].map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
            className={cn('px-3.5 py-2 rounded-full text-xs font-medium capitalize whitespace-nowrap transition',
              filter === f ? 'bg-primary-600 text-white' : 'bg-black/[.04] dark:bg-white/10 text-[var(--cf-ink-soft)]')}>
            {f === 'Open' ? 'Open' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onCreate)} className="bg-[var(--cf-surface)] rounded-2xl border border-[var(--cf-line)] shadow-sm p-5 mb-4 grid sm:grid-cols-4 gap-3">
          <select className={selectClass} {...register('type')} aria-label="Request type">
            {REQUEST_TYPES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
          </select>
          <input placeholder="Title" className={inputClass} {...register('title', { required: true })} aria-label="Title" />
          <input placeholder="Description" className={inputClass} {...register('description')} aria-label="Description" />
          <button type="submit" className={btnClass('success', 'medium')}>Submit</button>
        </form>
      )}

      {loading ? <LoadingState /> : visible.length === 0 ? (
        <Card><EmptyState title="No requests here" hint="Try another filter." /></Card>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => {
            const open = openId === r._id;
            return (
              <article key={r._id} className="rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-line)] shadow-1 p-5">
                <button onClick={() => setOpenId(open ? null : r._id)} aria-expanded={open} className="w-full text-left">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{r.title}</span>
                        <Badge tone="bg-black/[.05] dark:bg-white/10 text-[var(--cf-ink-soft)]">{r.type}</Badge>
                      </span>
                      <span className="block text-sm text-[var(--cf-ink-mute)] mt-0.5 line-clamp-1">{r.description || 'No description'}</span>
                      <span className="block text-xs text-[var(--cf-ink-mute)] mt-1">
                        {r.student?.name || '—'} · {fmt(r.createdAt)}
                        {r.assignedTo?.name ? ` · with ${r.assignedTo.name}` : ''}
                      </span>
                    </span>
                    <Badge status={r.status}>{(r.status || 'pending').replace(/_/g, ' ')}</Badge>
                  </span>
                </button>
                {open && (
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <WorkflowTimeline steps={timelineFor(r)} />
                    <div>
                      {r.resolution && (
                        <p className="text-sm rounded-xl bg-black/[.03] dark:bg-white/[.05] p-3 mb-3">{r.resolution}</p>
                      )}
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cf-ink-mute)] mb-1.5">Next action</p>
                      {canReview && !['approved', 'rejected'].includes(r.status) ? (
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => updateStatus(r._id, r.status === 'pending' ? 'in_review' : 'approved')} className={btnClass('success', 'small')}>
                            {r.status === 'pending' ? 'Start review' : 'Approve'}
                          </button>
                          <button onClick={() => updateStatus(r._id, 'rejected')} className={btnClass('danger', 'small')}>Reject</button>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--cf-ink-mute)]">
                          {['approved', 'rejected'].includes(r.status) ? `Resolved as ${r.status}.` : 'Waiting on a reviewer.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
