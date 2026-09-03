// NotificationsBell: bell icon with dropdown list of the current user's
// notifications (GET /notifications, PATCH /:id/read).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function NotificationsBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef(null);

  const unread = items.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setItems(data.data || []);
    } catch {
      /* handled */
    }
  }, []);

  useEffect(() => {
    if (open && !loaded) {
      fetchNotifications();
      setLoaded(true);
    }
  }, [open, loaded, fetchNotifications]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const markRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await api.patch(`/notifications/${notification._id}/read`);
      setItems((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );
    } catch {
      /* handled */
    }
  };

  const openItem = async (notification) => {
    await markRead(notification);
    if (notification.link && notification.link.startsWith('/')) {
      setOpen(false);
      navigate(notification.link);
    }
  };

  const formatTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-lg border border-gray-100 z-30">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">
            Notifications
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">
              No notifications yet.
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n._id}
                onClick={() => openItem(n)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${
                  n.isRead ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      n.isRead ? 'bg-gray-200' : 'bg-primary-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {n.message}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formatTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationsBell;
