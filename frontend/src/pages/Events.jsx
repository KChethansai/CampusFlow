// Events + announcements: campus life in one place. Students register;
// faculty/admins publish. Announcements surface here (not guessed keywords).
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { CalendarDays, Megaphone, Plus } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../store/useAuth';
import { Badge, Card, EmptyState, LoadingState, PageHeader } from '../components/ui/primitives';
import { staggerChild, staggerParent } from '../system/motion';
import { btnClass, cn, inputClass, labelClass } from '../system/tokens';

const TYPES = ['academic', 'cultural', 'sports', 'technical', 'placement', 'other'];
const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const brutalField = cn(inputClass,
  'border-2 border-[var(--cf-ink)] rounded-[10px] shadow-brutal-sm focus:ring-[3px] focus:ring-[#0055ff] focus:border-[#0055ff]');

const TYPE_BG = {
  academic: 'bg-frame text-volt',
  cultural: 'bg-volt text-coal',
  sports: 'bg-frame text-volt',
  technical: 'bg-frame text-volt',
  placement: 'bg-gold text-coal',
  other: 'bg-[var(--cf-surface-2)] text-[var(--cf-ink-soft)]'
};

export default function Events() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const canPublish = ['college_admin', 'super_admin', 'faculty'].includes(user?.role);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [tab, setTab] = useState('events');
  const [busy, setBusy] = useState(null);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { title: '', description: '', type: 'technical', startAt: '', visibility: 'public' } });
  const noteForm = useForm({ defaultValues: { title: '', body: '' } });

  const fetchAll = async () => {
    const [e, a] = await Promise.allSettled([api.get('/events'), api.get('/announcements')]);
    if (e.status === 'fulfilled') setEvents(e.value.data.data || []);
    if (a.status === 'fulfilled') setNotes(a.value.data.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...events].sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0))
      .filter((e) => !e.startAt || new Date(e.startAt).getTime() >= now - 86400000);
  }, [events]);

  const registered = useMemo(
    () => new Set(events.filter((e) => (e.registeredStudents || []).some((s) => String(s?._id || s) === String(user?._id))).map((e) => String(e._id))),
    [events, user?._id]
  );

  const onCreate = async (form) => {
    try {
      await api.post('/events', { ...form, startAt: form.startAt || undefined });
      toast.success('Event published');
      setShowForm(false);
      reset();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish event');
    }
  };

  const onNote = async (form) => {
    try {
      await api.post('/announcements', form);
      toast.success('Announcement posted');
      setShowNote(false);
      noteForm.reset();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post announcement');
    }
  };

  const registerFor = async (id) => {
    setBusy(id);
    try {
      await api.post(`/events/${id}/register`);
      toast.success('Registered');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle={`${upcoming.length} upcoming · ${notes.length} announcements`}
        actions={canPublish && (
          <>
            <button onClick={() => setShowNote((v) => !v)} className={btnClass('outline', 'medium')}>
              <Megaphone size={15} /> Announce
            </button>
            <button onClick={() => setShowForm((v) => !v)} className={btnClass('primary', 'medium')}>
              <Plus size={15} /> {showForm ? 'Close' : 'New event'}
            </button>
          </>
        )}
      />

      <div className="flex gap-1.5 p-1.5 mb-4 rounded-[12px] border-2 border-[var(--cf-ink)] bg-[var(--cf-surface)] shadow-brutal-sm w-fit" role="tablist" aria-label="Campus life">
        {[['events', 'Events'], ['announcements', 'Announcements']].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cn('px-4 py-2 rounded-[8px] text-xs font-display font-semibold transition-all border-2',
              tab === k ? 'bg-gold text-coal border-frame shadow-brutal-sm' : 'border-transparent text-[var(--cf-ink-soft)] hover:text-[var(--cf-ink)]')}>
            {label}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onCreate)} className="card-brutal rounded-2xl p-5 mb-4 grid sm:grid-cols-2 gap-3">
          <p className="sm:col-span-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cf-ink-mute)]">New event</p>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="ev-title">Title</label>
            <input id="ev-title" className={brutalField} placeholder="Tech fest auditions" {...register('title', { required: true })} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="ev-desc">Description</label>
            <textarea id="ev-desc" className={brutalField} rows={2} {...register('description')} />
          </div>
          <div>
            <label className={labelClass} htmlFor="ev-type">Type</label>
            <select id="ev-type" className={brutalField} {...register('type')}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="ev-start">Starts</label>
            <input id="ev-start" type="datetime-local" className={brutalField} {...register('startAt')} />
          </div>
          <button type="submit" className={btnClass('success', 'medium') + ' sm:col-span-2'}>Publish event</button>
        </form>
      )}

      {showNote && (
        <form onSubmit={noteForm.handleSubmit(onNote)} className="card-brutal rounded-2xl p-5 mb-4 space-y-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cf-ink-mute)]">New announcement</p>
          <div>
            <label className={labelClass} htmlFor="an-title">Announcement</label>
            <input id="an-title" className={brutalField} placeholder="Mid-sem schedule released" {...noteForm.register('title', { required: true })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="an-body">Details</label>
            <textarea id="an-body" className={brutalField} rows={3} {...noteForm.register('body')} />
          </div>
          <button type="submit" className={btnClass('success', 'medium')}>Post announcement</button>
        </form>
      )}

      {loading ? <LoadingState /> : tab === 'events' ? (
        upcoming.length === 0 ? <Card><EmptyState editorial title="Nothing scheduled" hint="New events will appear here." /></Card> : (
          <motion.div {...staggerParent(0.05)} initial="initial" animate="animate" className="grid md:grid-cols-2 gap-4">
            {upcoming.map((e) => (
              <motion.article key={e._id} variants={staggerChild} className="card-brutal rounded-2xl p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={cn('brutal-tag text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full', TYPE_BG[e.type] || TYPE_BG.other)}>
                    {e.type || 'event'}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-[var(--cf-ink-mute)]">
                    <CalendarDays size={13} aria-hidden /> {fmtDT(e.startAt)}
                  </span>
                </div>
                <h3 className="font-display font-bold leading-snug text-lg">{e.title}</h3>
                {e.description && <p className="text-sm text-[var(--cf-ink-mute)] line-clamp-2 mt-1 mb-3">{e.description}</p>}
                <div className="flex items-center justify-between gap-2 pt-3 border-t-2 border-[var(--cf-ink)]">
                  {isStudent && (registered.has(String(e._id))
                    ? <span className="brutal-tag bg-volt text-coal text-xs font-bold px-3 py-1 rounded-full">✓ Registered</span>
                    : <button onClick={() => registerFor(e._id)} disabled={busy === e._id} className={btnClass('primary', 'small')}>{busy === e._id ? '…' : 'Register →'}</button>)}
                  {!isStudent && (
                    <span className="text-xs font-display font-semibold">
                      {(e.registeredStudents || []).length} registered
                    </span>
                  )}
                  {(e.registeredStudents || []).length > 0 && isStudent && (
                    <span className="text-[11px] text-[var(--cf-ink-mute)]">{(e.registeredStudents || []).length} going</span>
                  )}
                </div>
              </motion.article>
            ))}
          </motion.div>
        )
      ) : (
        notes.length === 0 ? <Card><EmptyState editorial title="No announcements" hint="Important updates will land here." /></Card> : (
          <div className="space-y-4">
            {notes.map((n) => (
              <article key={n._id} className="card-brutal rounded-2xl p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold flex items-center gap-2">
                    <span className="w-8 h-8 grid place-items-center rounded-[8px] bg-flag text-white border-2 border-[var(--cf-ink)]" aria-hidden>
                      <Megaphone size={14} />
                    </span>
                    {n.title}
                  </h3>
                  {n.pinned && <Badge status="open">Pinned</Badge>}
                </div>
                {n.body && <p className="mt-2 text-sm text-[var(--cf-ink-soft)]">{n.body}</p>}
                <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[var(--cf-ink-mute)]">{n.createdBy?.name || ''} · {fmtD(n.createdAt)}</p>
              </article>
            ))}
          </div>
        )
      )}
    </div>
  );
}
