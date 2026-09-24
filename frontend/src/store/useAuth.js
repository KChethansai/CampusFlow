import { create } from 'zustand';
import api from '../api/axios';
import { clearAllOfflineCache } from '../config/api';
import { useSocket } from './useSocket';

const readStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem('cf_auth') || 'null');
  } catch {
    clearAllOfflineCache();
    return null;
  }
};

const initial = readStoredAuth();
const hasSession = Boolean(initial?.accessToken && initial?.user);

export const useAuth = create((set) => ({
  user: hasSession ? initial.user : null,
  accessToken: hasSession ? initial.accessToken : null,
  refreshToken: hasSession ? initial.refreshToken : null,
  isAuthenticated: hasSession,
  loading: false,
  error: null,

  loginUser: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      clearAllOfflineCache();
      const payload = {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
      localStorage.setItem('cf_auth', JSON.stringify(payload));
      set({ ...payload, isAuthenticated: true, loading: false, error: null });
      useSocket.getState().connect();
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ loading: false, error: message });
      throw err;
    }
  },

  logoutUser: async () => {
    try {
      const auth = readStoredAuth();
      if (auth?.refreshToken) {
        await api.post('/auth/logout', { refreshToken: auth.refreshToken });
      }
    } catch {
      // Logout even if API fails
    } finally {
      localStorage.removeItem('cf_auth');
      clearAllOfflineCache();
      useSocket.getState().disconnect();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
    }
  },

  loadUserFromStorage: () => {
    const auth = readStoredAuth();
    if (auth?.accessToken && auth?.user) {
      set({
        user: auth.user,
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        isAuthenticated: true
      });
      // Revalidate against server without blocking paint.
      api.get('/auth/me').then(({ data }) => {
        const serverUser = data.user || data.data;
        if (serverUser) {
          const current = readStoredAuth();
          if (current) {
            localStorage.setItem('cf_auth', JSON.stringify({ ...current, user: serverUser }));
          }
          set({ user: serverUser });
        }
      }).catch(() => { /* token refresh interceptor handles expiry */ });
    }
  },

  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token, password) => {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const { data } = await api.patch('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return data;
  },

  completeOnboardingTour: async () => {
    const { data } = await api.patch('/users/me/onboarding-tour', { completed: true });
    const user = data.data || data.user;
    if (user) {
      const auth = readStoredAuth();
      if (auth) localStorage.setItem('cf_auth', JSON.stringify({ ...auth, user }));
      set({ user });
    } else {
      set((state) => ({ user: state.user ? { ...state.user, onboardingTourCompleted: true } : null }));
    }
    return data;
  },

  clearError: () => set({ error: null })
}));

export default useAuth;
