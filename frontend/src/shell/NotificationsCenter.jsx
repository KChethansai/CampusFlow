// NotificationsCenter: glass popover tray — category tabs, swipe-to-dismiss, volt unread dot.
// Reskin only: Motion list transitions, categorized icons, volt dot retained.
// NOTE: components/ui/{buttons,cards,overlays}/ do not exist in this repo — composed locally.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Briefcase, GraduationCap, Inbox, Megaphone, Settings2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import api from '../api/axios';
import { useSocket } from '../store/useSocket';
import { cn } from '../system/tokens';
import { EASE_OUT, motionVariants } from '../system/motion';

const CATEGORY_ICON = {
  Academic: GraduationCap,
  Placement: Briefcase,
  Requests: Inbox,
  Campus: Megaphone,
  System: Settings2
};

const groupOf = (n) => {
  if (n._campus) return 'Campus';
  const t = `${n.title ?? ''} ${n.message ?? ''} ${n.type ?? ''}`.toLowerCase();
  if (/assign|grade|attend|subject|course|exam/.test(t)) return 'Academic';
  if (/placement|drive|offer|interview|application|company/.test(t)) return 'Placement';
  if (/request|leave|bonafide|revaluation|approv/.test(t)) return 'Requests';
  return 'System';
};

const ORDER = ['Academic', 'Placement', 'Requests', 'Campus', 'System'];
const TABS = ['All', 'Academic', 'Placement', 'System', 'Unread'];

export default function NotificationsCenter() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const unread = items.filter((n) => !n.isRead).length;

  const refresh = async () => {
    const [n, a, e] = await Promise.allSettled([
      api.get('/notifications'),
      api.get('/announcements'),
      api.get('/events')
    ]);
    const rows = n.status === 'fulfilled' ? [...(n.value.data.data || [])] : [];
    if (a.status === 'fulfilled') {
      (a.value.data.data || []).slice(0, 5).forEach((x) => rows.push({
        _id: `an-${x._id}`, _campus: true, isRead: true,
        title: x.title, message: x.body, link: '/events'
      }));
    }
    if (e.status === 'fulfilled') {
      const now = Date.now();
      (e.value.data.data || [])
        .filter((x) => !x.startAt || new Date(x.startAt).getTime() >= now - 86400000)
        .slice(0, 5)
        .forEach((x) => rows.push({
          _id: `ev-${x._id}`, _campus: true, isRead: true,
          title: x.title,
          message: x.startAt ? `Starts ${new Date(x.startAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : '',
          link: '/events'
        }));
    }
    setItems(rows);
  };

  useEffect(() => {
    if (!open || items.length) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  // Live updates via socket; slow poll retained as offline fallback.
  const lastEvent = useSocket((s) => s.lastEvent);
  useEffect(() => {
    if (lastEvent?.channel === 'notification:new' && lastEvent.payload?.notification) {
      setItems((prev) => [lastEvent.payload.notification, ...prev]);
    } else if (lastEvent && ['announcement:posted', 'attendance:marked', 'request:updated'].includes(lastEvent.channel)) {
      refresh(); // merged campus feed — refetch on live signal
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);
  useEffect(() => {
    const id = setInterval(refresh, 300000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => clearInterval(id);
  }, []);

  const openItem = async (n) => {
    if (n._campus) {
      if (n.link?.startsWith('/')) {
        setOpen(false);
        navigate(n.link);
      }
      return;
    }
    if (!n.isRead) {
      try {
        await api.patch(`/notifications/${n._id}/read`);
        setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      } catch { /* handled */ }
    }
    if (n.link?.startsWith('/')) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const grouped = ORDER.map((g) => ({
    group: g,
    rows: items.filter((n) => {
      const inTab = filter === 'All' ? true : filter === 'Unread' ? !n.isRead : groupOf(n) === filter;
      return groupOf(n) === g && inTab;
    })
  })).filter((g) => g.rows.length);

  const dismiss = (id) => setItems((prev) => prev.filter((x) => x._id !== id));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative min-w-11 min-h-11 grid place-items-center rounded-full text-[var(--cf-ink-soft)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-black/[0.05] hover:text-[var(--cf-ink)] dark:hover:bg-white/10"
      >
        <Bell size={19} aria-hidden />
        {unread > 0 && (
          <span
            className="absolute right-2 top-2 w-2.5 h-2.5 rounded-full bg-[#E7A66D] ring-2 ring-[var(--cf-surface)] cf-unread-pulse"
            aria-hidden
          />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button aria-label="Close notifications" onClick={() => setOpen(false)} className="fixed inset-0 z-30 cursor-default" />
            <motion.div
              {...(reduced ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : motionVariants.popover)}
              className="cf-glass absolute right-0 top-full mt-2 w-[22rem] max-w-[90vw] max-h-[70vh] overflow-hidden rounded-2xl border border-[var(--cf-line)] shadow-[0_24px_64px_-16px_rgba(16,24,40,0.35)] z-40 flex flex-col"
              role="dialog"
              aria-label="Notification center"
            >
              <div className="px-4 pt-3 pb-2 border-b border-[var(--cf-line)]">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-semibold text-sm tracking-tight text-[var(--cf-ink)]">
                    Notifications{unread > 0 && ` (${unread})`}
                  </p>
                  <div className="flex gap-1 text-xs overflow-x-auto" role="tablist" aria-label="Filter">
                    {TABS.map((f) => (
                      <button
                        key={f}
                        role="tab"
                        aria-selected={filter === f}
                        onClick={() => setFilter(f)}
                        className={cn(
                          'px-2.5 min-h-11 sm:min-h-0 sm:py-1 rounded-full font-mono text-[10px] font-medium uppercase tracking-wider transition-all whitespace-nowrap',
                          filter === f
                            ? 'bg-[#A94727] text-white'
                            : 'text-[var(--cf-ink-mute)] hover:bg-black/[0.05] dark:hover:bg-white/10'
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="overflow-y-auto" aria-live="polite" aria-atomic="false">
                {grouped.length === 0 && (
                  <p className="px-4 py-10 text-center text-sm text-[var(--cf-ink-mute)]">You’re all caught up.</p>
                )}
                {grouped.map((g) => {
                  const GroupIcon = CATEGORY_ICON[g.group] || Bell;
                  return (
                    <div key={g.group}>
                      <p className="flex items-center gap-1.5 px-4 pt-3 pb-1 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--cf-ink-mute)]">
                        <GroupIcon size={13} aria-hidden className="text-[#D86D3E] dark:text-[#F5B08A]" />
                        {g.group}
                        <span className="ml-auto rounded-full border border-[var(--cf-line)] px-1.5 py-px text-[10px] tracking-normal" aria-hidden>
                          {g.rows.length}
                        </span>
                      </p>
                      <AnimatePresence initial={false}>
                        {g.rows.map((n) => {
                          const RowIcon = CATEGORY_ICON[groupOf(n)] || Bell;
                          return (
                            <motion.div
                              key={n._id}
                              layout={!reduced}
                              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={reduced ? { opacity: 0 } : { opacity: 0, x: 64, transition: { duration: 0.18, ease: EASE_OUT } }}
                              transition={{ duration: 0.22, ease: EASE_OUT }}
                              drag={reduced ? false : 'x'}
                              dragConstraints={{ left: 0, right: 0 }}
                              dragElastic={0.7}
                              onDragEnd={(_, info) => { if (info.offset.x < -70 || info.offset.x > 70) dismiss(n._id); }}
                              className="border-b border-[var(--cf-line)]/60 last:border-0"
                            >
                              <button
                                onClick={() => openItem(n)}
                                className={cn('w-full text-left px-3 py-2.5 min-h-11 transition rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05]', n.isRead && 'opacity-65')}
                              >
                                <span className="flex items-start gap-2">
                                  <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-[10px]', n.isRead ? 'bg-[var(--cf-surface-2)]/80 text-[var(--cf-ink-mute)]' : 'bg-[#D86D3E]/12 text-[#D86D3E] dark:text-[#F5B08A]')} aria-hidden>
                                    <RowIcon size={14} />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--cf-ink)]">
                                      <span className="truncate">{n.title}</span>
                                      {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-[#E7A66D]" aria-label="Unread" role="img" />}
                                    </span>
                                    {n.message && <span className="block text-xs text-[var(--cf-ink-mute)] line-clamp-2 mt-0.5">{n.message}</span>}
                                  </span>
                                </span>
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
