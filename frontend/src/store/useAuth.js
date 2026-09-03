// useAuth: Zustand store for auth state, mirroring the former Redux slice.
import { create } from 'zustand';
import api from '../api/axios';

const readStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem('cf_auth') || 'null');
  } catch {
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
      const payload = {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
      localStorage.setItem('cf_auth', JSON.stringify(payload));
      set({ ...payload, isAuthenticated: true, loading: false, error: null });
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
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    const { data } = await api.patch('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return data;
  },

  clearError: () => set({ error: null })
}));

export default useAuth;
