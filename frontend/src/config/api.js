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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject, original }) => {
    if (error || !token) {
      reject(error || new Error('Token refresh failed'));
    } else {
      original.headers.Authorization = `Bearer ${token}`;
      resolve(api(original));
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, original });
        });
      }

      const auth = safeReadAuth();
      if (!auth?.refreshToken) {
        return Promise.reject(error);
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken: auth.refreshToken }
        );

        const updatedAuth = {
          ...auth,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? auth.refreshToken
        };
        localStorage.setItem('cf_auth', JSON.stringify(updatedAuth));

        processQueue(null, data.accessToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('cf_auth');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
