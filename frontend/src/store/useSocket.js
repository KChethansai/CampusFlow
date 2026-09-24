// useSocket: Zustand store for the Socket.IO client — singleton socket,
// auto-reconnect, last live event per channel for badge/toast consumers.
import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../api/axios';

let socket = null; // singleton — one connection per tab

const baseUrl = () => {
  const raw = api.defaults.baseURL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  return raw.replace(/\/api\/v1\/?$/, ''); // strip API suffix → socket root
};

const readToken = () => {
  try {
    return JSON.parse(localStorage.getItem('cf_auth') || 'null')?.accessToken || null;
  } catch {
    return null;
  }
};

export const syncSocketToken = (newToken) => {
  if (!socket) return;
  // Function form — every (re)handshake reads the freshest token from
  // storage instead of pinning the refreshed value that will itself expire.
  socket.auth = (cb) => {
    cb({ token: readToken() || newToken });
  };
  if (!socket.connected) {
    socket.connect();
  }
};

if (typeof window !== 'undefined') {
  window.__cf_sync_socket_token = syncSocketToken;
}

export const useSocket = create((set, get) => ({
  connected: false,
  lastEvent: null, // { channel, payload, at } — consumers toast/bump badges

  connect: () => {
    if (socket?.connected) return;
    const token = readToken();
    if (!token) return;
    if (socket) {
      socket.auth = (cb) => {
        cb({ token: readToken() || token });
      };
      socket.connect();
      return;
    }
    socket = io(baseUrl(), {
      auth: (cb) => {
        cb({ token: readToken() });
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000
    });
    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));
    socket.on('connect_error', () => set({ connected: false }));
    ['notification:new', 'announcement:posted', 'announcement:updated', 'attendance:marked', 'request:updated'].forEach((channel) => {
      socket.on(channel, (payload) => set({ lastEvent: { channel, payload, at: Date.now() } }));
    });
  },

  disconnect: () => {
    socket?.disconnect();
    set({ connected: false });
  },

  unreadCount: 0,
  refreshUnread: async () => {
    try {
      const { data } = await api.get('/notifications');
      const rows = data.data || [];
      set({ unreadCount: rows.filter((n) => !n.isRead).length });
    } catch { /* handled — socket still delivers live events */ }
  },

  bumpUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 }))
}));

export default useSocket;
