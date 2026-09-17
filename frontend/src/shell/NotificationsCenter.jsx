// NotificationsCenter: brutal popover tray — category tabs, swipe-to-dismiss, volt unread dot.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import api from '../api/axios';
import { cn } from '../system/tokens';
import { motionVariants } from '../system/motion';

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

  // Poll unread count lightly while mounted.
  useEffect(() => {
    const id = setInterval(refresh, 60000);
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
        className="relative min-w-11 min-h-11 grid place-items-center border-2 border-transparent hover:border-[var(--cf-ink)] hover:shadow-brutal-sm text-[var(--cf-ink-soft)] transition-all"
      >
        <Bell size={19} aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-volt text-[#111111] font-mono text-[10px] font-black border-2 border-[var(--cf-ink)] flex items-center justify-center" aria-hidden>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button aria-label="Close notifications" onClick={() => setOpen(false)} className="fixed inset-0 z-30 cursor-default" />
            <motion.div
              {...motionVariants.popover}
              className="absolute right-0 top-full mt-2 w-[22rem] max-w-[90vw] max-h-[70vh] overflow-hidden bg-[var(--cf-surface)] border-2 border-[var(--cf-ink)] shadow-brutal-lg z-40 flex flex-col"
              role="dialog"
              aria-label="Notification center"
            >
              <div className="racing-stripe h-1.5 w-full border-b-2 border-[var(--cf-ink)]" aria-hidden />
              <div className="px-4 pt-3 pb-2 border-b-2 border-[var(--cf-ink)] bg-volt">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-black text-sm uppercase tracking-tight text-[#111111]">
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
                          'px-2.5 min-h-11 sm:min-h-0 sm:py-1 font-mono text-[10px] font-bold uppercase tracking-wider border-2 transition-all whitespace-nowrap',
                          filter === f
                            ? 'bg-[var(--cf-ink)] text-[var(--cf-surface)] border-[var(--cf-ink)]'
                            : 'text-[#111111]/70 border-transparent hover:border-[#111111]'
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
                {grouped.map((g) => (
                  <div key={g.group}>
                    <p className="px-4 pt-3 pb-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--cf-ink-mute)]">{g.group}</p>
                    {g.rows.map((n) => (
                      <motion.div
                        key={n._id}
                        drag={reduced ? false : 'x'}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.7}
                        onDragEnd={(_, info) => { if (info.offset.x < -70 || info.offset.x > 70) dismiss(n._id); }}
                        className="border-b border-[var(--cf-line)]/60"
                      >
                        <button
                          onClick={() => openItem(n)}
                          className={cn('w-full text-left px-4 py-2.5 min-h-11 hover:bg-black/[.03] dark:hover:bg-white/[.05] transition', n.isRead && 'opacity-65')}
                        >
                          <span className="flex items-start gap-2">
                            <span className={cn('mt-1.5 w-2.5 h-2.5 shrink-0 border border-[var(--cf-ink)]', n.isRead ? 'bg-transparent opacity-30' : 'bg-volt')} aria-hidden />
                            <span className="min-w-0">
                              <span className="block text-sm font-bold text-[var(--cf-ink)] truncate">{n.title}</span>
                              {n.message && <span className="block text-xs text-[var(--cf-ink-mute)] line-clamp-2 mt-0.5">{n.message}</span>}
                            </span>
                          </span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
