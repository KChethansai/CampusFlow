// NotificationsCenter: grouped inbox — server notifications plus live campus
// announcements/events (real endpoints, not keyword guesses).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import api from '../api/axios';
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

export default function NotificationsCenter() {
  const navigate = useNavigate();
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
    rows: items.filter((n) => groupOf(n) === g && (filter === 'All' || (filter === 'Unread' ? !n.isRead : true)))
  })).filter((g) => g.rows.length);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative p-2 rounded-full text-[var(--cf-ink-soft)] hover:bg-black/[.05] dark:hover:bg-white/10 transition"
      >
        <Bell size={19} aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
              className="absolute right-0 top-full mt-2 w-[22rem] max-w-[90vw] max-h-[70vh] overflow-hidden bg-[var(--cf-surface)] rounded-2xl shadow-4 border border-[var(--cf-line)] z-40 flex flex-col"
              role="dialog"
              aria-label="Notification center"
            >
              <div className="px-4 pt-3 pb-2 border-b border-[var(--cf-line)]">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-[var(--cf-ink)]">Notifications</p>
                  <div className="flex gap-1 text-xs" role="tablist" aria-label="Filter">
                    {['All', 'Unread'].map((f) => (
                      <button
                        key={f}
                        role="tab"
                        aria-selected={filter === f}
                        onClick={() => setFilter(f)}
                        className={`px-2.5 py-1 rounded-full font-medium transition ${
                          filter === f ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300' : 'text-[var(--cf-ink-mute)] hover:bg-black/[.04] dark:hover:bg-white/10'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="overflow-y-auto">
                {grouped.length === 0 && (
                  <p className="px-4 py-10 text-center text-sm text-[var(--cf-ink-mute)]">You’re all caught up.</p>
                )}
                {grouped.map((g) => (
                  <div key={g.group}>
                    <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--cf-ink-mute)]">{g.group}</p>
                    {g.rows.map((n) => (
                      <button
                        key={n._id}
                        onClick={() => openItem(n)}
                        className={`w-full text-left px-4 py-2.5 border-b border-[var(--cf-line)]/60 hover:bg-black/[.02] dark:hover:bg-white/[.04] transition ${n.isRead ? 'opacity-65' : ''}`}
                      >
                        <span className="flex items-start gap-2">
                          <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? 'bg-black/15 dark:bg-white/20' : 'bg-primary-500'}`} aria-hidden />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-[var(--cf-ink)] truncate">{n.title}</span>
                            {n.message && <span className="block text-xs text-[var(--cf-ink-mute)] line-clamp-2 mt-0.5">{n.message}</span>}
                          </span>
                        </span>
                      </button>
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
