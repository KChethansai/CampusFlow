import api from '../../api/axios';
import { setCredentials, logout, setLoading, setError } from './authSlice';

export const loginUser = (email, password) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const { data } = await api.post('/auth/login', { email, password });

    const authPayload = {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    };

    localStorage.setItem('cf_auth', JSON.stringify(authPayload));
    dispatch(setCredentials(authPayload));
    return data;
  } catch (err) {
    const message = err.response?.data?.message || 'Login failed';
    dispatch(setError(message));
    throw err;
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    const auth = JSON.parse(localStorage.getItem('cf_auth') || 'null');
    if (auth?.refreshToken) {
      await api.post('/auth/logout', { refreshToken: auth.refreshToken });
    }
  } catch {
    // Logout even if API fails
  } finally {
    localStorage.removeItem('cf_auth');
    dispatch(logout());
  }
};

export const loadUserFromStorage = () => (dispatch) => {
  const auth = JSON.parse(localStorage.getItem('cf_auth') || 'null');
  if (auth?.accessToken && auth?.user) {
    dispatch(setCredentials(auth));
  }
};

export const changePassword = (currentPassword, newPassword) => async () => {
  const { data } = await api.patch('/auth/change-password', { currentPassword, newPassword });
  return data;
};