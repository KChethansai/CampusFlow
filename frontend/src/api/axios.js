import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
});

const safeReadAuth = () => {
  try {
    return JSON.parse(localStorage.getItem('cf_auth') || 'null');
  } catch {
    localStorage.removeItem('cf_auth');
    return null;
  }
};

api.interceptors.request.use((config) => {
  const auth = safeReadAuth();
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const auth = safeReadAuth();

      if (auth?.refreshToken) {
        try {
          refreshPromise = refreshPromise || axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken: auth.refreshToken }
          );
          const { data } = await refreshPromise;
          refreshPromise = null;

          const updatedAuth = {
            ...auth,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
          };
          localStorage.setItem('cf_auth', JSON.stringify(updatedAuth));

          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch (err) {
          refreshPromise = null;
          localStorage.removeItem('cf_auth');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;