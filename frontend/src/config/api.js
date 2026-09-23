import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true // cookie-backed refresh stays working behind CORS
});

const OFFLINE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const OFFLINE_CACHE_PREFIX = 'cf_offline_api_v1:';
const DASHBOARD_READ_PATHS = new Set([
  '/announcements', '/users', '/departments', '/courses', '/requests', '/ai-reports',
  '/assignments', '/job-applications', '/notifications', '/subjects', '/submissions',
  '/attendance', '/job-drives', '/companies', '/analytics/attendance-trend',
  '/analytics/placement-funnel', '/analytics/enrollment-overview'
]);

const accountScope = (user) => {
  const id = user?._id || user?.id;
  if (!id) return null;
  const rawInstitution = user.institution?._id || user.institution;
  const institution = rawInstitution && typeof rawInstitution === 'object' ? 'none' : rawInstitution || 'none';
  return `${id}:${institution}:${user.role || 'unknown'}`;
};

const cacheStorageKey = (scope) => scope ? `${OFFLINE_CACHE_PREFIX}${encodeURIComponent(scope)}` : null;

const requestIdentity = (config) => {
  try {
    const url = new URL(config.url || '', config.baseURL || api.defaults.baseURL);
    let path = url.pathname;
    const apiRoot = new URL(config.baseURL || api.defaults.baseURL).pathname.replace(/\/$/, '');
    if (apiRoot && path.startsWith(`${apiRoot}/`)) path = path.slice(apiRoot.length);
    path = path.replace(/\/$/, '') || '/';
    if (!DASHBOARD_READ_PATHS.has(path) && !/^\/attendance\/student\/[^/]+$/.test(path)) return null;
    return `${path}${url.search}`;
  } catch {
    return null;
  }
};

const readOfflineCache = (storageKey, identity) => {
  try {
    const entries = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const entry = entries[identity];
    if (!entry || Date.now() - entry.savedAt > OFFLINE_CACHE_TTL) return null;
    return entry.data;
  } catch {
    return null;
  }
};

const writeOfflineCache = (storageKey, identity, data) => {
  try {
    const entries = JSON.parse(localStorage.getItem(storageKey) || '{}');
    entries[identity] = { savedAt: Date.now(), data };
    for (const [key, entry] of Object.entries(entries)) {
      if (!entry?.savedAt || Date.now() - entry.savedAt > OFFLINE_CACHE_TTL) delete entries[key];
    }
    const serialized = JSON.stringify(entries);
    if (serialized.length < 3_500_000) localStorage.setItem(storageKey, serialized);
  } catch {
    // Offline caching is best-effort when browser storage is unavailable or full.
  }
};

const clearOfflineCache = (storageKey) => {
  if (!storageKey) return;
  try { localStorage.removeItem(storageKey); } catch { /* storage may be disabled */ }
};

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
  const scope = accountScope(auth?.user);
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  if (config.method?.toLowerCase() === 'get' && scope) {
    const identity = requestIdentity(config);
    if (identity) config._offlineCache = { storageKey: cacheStorageKey(scope), identity };
  } else if (scope) {
    config._offlineCacheStorageKey = cacheStorageKey(scope);
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
  (res) => {
    const cache = res.config?._offlineCache;
    if (cache && res.config.responseType !== 'blob' && res.config.responseType !== 'arraybuffer') {
      writeOfflineCache(cache.storageKey, cache.identity, res.data);
    }
    if (res.config?.method?.toLowerCase() !== 'get') {
      clearOfflineCache(res.config?._offlineCacheStorageKey);
    }
    return res;
  },
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

    // Serve stale scoped GET data only when the request has no HTTP response.
    const cache = original?._offlineCache;
    if (!error.response && cache) {
      const data = readOfflineCache(cache.storageKey, cache.identity);
      if (data !== null) {
        return {
          config: original,
          data,
          headers: { 'x-campusflow-offline-cache': 'stale' },
          status: 200,
          statusText: 'OK'
        };
      }
    }

    return Promise.reject(error);
  }
);

export default api;
