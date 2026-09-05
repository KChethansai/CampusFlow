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
import { btnClass, cn, inputClass, labelClass, selectClass } from '../system/tokens';

const TYPES = ['academic', 'cultural', 'sports', 'technical', 'placement', 'other'];
const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

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

      <div className="flex gap-1.5 mb-4" role="tablist" aria-label="Campus life">
        {[['events', 'Events'], ['announcements', 'Announcements']].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cn('px-4 py-2 rounded-full text-xs font-medium transition',
              tab === k ? 'bg-primary-600 text-white' : 'bg-black/[.04] dark:bg-white/10 text-[var(--cf-ink-soft)]')}>
            {label}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onCreate)} className="bg-[var(--cf-surface)] rounded-2xl border border-[var(--cf-line)] shadow-sm p-5 mb-4 grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="ev-title">Title</label>
            <input id="ev-title" className={inputClass} placeholder="Tech fest auditions" {...register('title', { required: true })} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="ev-desc">Description</label>
            <textarea id="ev-desc" className={inputClass} rows={2} {...register('description')} />
          </div>
          <div>
            <label className={labelClass} htmlFor="ev-type">Type</label>
            <select id="ev-type" className={selectClass} {...register('type')}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="ev-start">Starts</label>
            <input id="ev-start" type="datetime-local" className={inputClass} {...register('startAt')} />
          </div>
          <button type="submit" className={btnClass('success', 'medium') + ' sm:col-span-2'}>Publish event</button>
        </form>
      )}

      {showNote && (
        <form onSubmit={noteForm.handleSubmit(onNote)} className="bg-[var(--cf-surface)] rounded-2xl border border-[var(--cf-line)] shadow-sm p-5 mb-4 space-y-3">
          <div>
            <label className={labelClass} htmlFor="an-title">Announcement</label>
            <input id="an-title" className={inputClass} placeholder="Mid-sem schedule released" {...noteForm.register('title', { required: true })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="an-body">Details</label>
            <textarea id="an-body" className={inputClass} rows={3} {...noteForm.register('body')} />
          </div>
          <button type="submit" className={btnClass('success', 'medium')}>Post announcement</button>
        </form>
      )}

      {loading ? <LoadingState /> : tab === 'events' ? (
        upcoming.length === 0 ? <Card><EmptyState editorial title="Nothing scheduled" hint="New events will appear here." /></Card> : (
          <motion.div {...staggerParent(0.05)} initial="initial" animate="animate" className="grid md:grid-cols-2 gap-3">
            {upcoming.map((e) => (
              <motion.article key={e._id} variants={staggerChild} className="rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-line)] shadow-1 p-5">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold leading-snug">{e.title}</h3>
                  <Badge tone="bg-black/[.05] dark:bg-white/10 text-[var(--cf-ink-soft)]">{e.type || 'event'}</Badge>
                </div>
                {e.description && <p className="text-sm text-[var(--cf-ink-mute)] line-clamp-2 mb-3">{e.description}</p>}
                <div className="flex items-center justify-between gap-2 text-xs text-[var(--cf-ink-mute)]">
                  <span className="flex items-center gap-1"><CalendarDays size={13} /> {fmtDT(e.startAt)}</span>
                  {isStudent && (registered.has(String(e._id))
                    ? <span className="font-medium text-green-600 dark:text-green-400">✓ Registered</span>
                    : <button onClick={() => registerFor(e._id)} disabled={busy === e._id} className={btnClass('primary', 'small')}>{busy === e._id ? '…' : 'Register'}</button>)}
                  {!isStudent && <span>{(e.registeredStudents || []).length} registered</span>}
                </div>
              </motion.article>
            ))}
          </motion.div>
        )
      ) : (
        notes.length === 0 ? <Card><EmptyState editorial title="No announcements" hint="Important updates will land here." /></Card> : (
          <div className="space-y-3">
            {notes.map((n) => (
              <article key={n._id} className="rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-line)] shadow-1 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{n.title}</h3>
                  {n.pinned && <Badge status="open">Pinned</Badge>}
                </div>
                {n.body && <p className="mt-1 text-sm text-[var(--cf-ink-soft)]">{n.body}</p>}
                <p className="mt-2 text-[11px] text-[var(--cf-ink-mute)]">{n.createdBy?.name || ''} · {fmtD(n.createdAt)}</p>
              </article>
            ))}
          </div>
        )
      )}
    </div>
  );
}
