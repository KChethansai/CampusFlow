import axios from 'axios';

const resolveBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) {
    if (!url || !url.trim()) {
      throw new Error('[CampusFlow Configuration Error] VITE_API_URL is missing in production build. Set VITE_API_URL to the production backend API URL (e.g. https://<backend>/api/v1).');
    }
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      throw new Error(`[CampusFlow Configuration Error] VITE_API_URL must be an absolute URL starting with http:// or https:// (received: "${trimmed}")`);
    }
    if (/localhost|127\.0\.0\.1/i.test(trimmed)) {
      throw new Error(`[CampusFlow Configuration Error] VITE_API_URL cannot point to localhost in production (received: "${trimmed}")`);
    }
    if (!/\/api\/v1\/?$/i.test(trimmed)) {
      // Tolerate a bare backend origin (the common Vercel misconfiguration):
      // normalize to <origin>/api/v1 instead of crashing to a blank page.
      // The boot probe + health check still fail loud if the host is wrong.
      console.warn('[CampusFlow] VITE_API_URL missing /api/v1 suffix, appending it.');
      return `${trimmed.replace(/\/$/, '')}/api/v1`;
    }
    return trimmed.replace(/\/$/, '');
  }
  return (url?.trim() || 'http://localhost:5000/api/v1').replace(/\/$/, '');
};

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true // cookie-backed refresh stays working behind CORS
});

const misconfiguredError = (baseURL, detail) => {
  const err = new Error('Service misconfigured — contact your administrator.');
  err.code = 'API_BASE_MISCONFIGURED';
  err.isApiBaseMisconfigured = true;
  err.baseURL = baseURL;
  if (detail) err.detail = detail;
  return err;
};

// Boot-time probe: catches a VITE_API_URL missing the /api/v1 suffix (which
// surfaces in prod as 404 `Route not found: /auth/login`) before any login
// attempt, and verifies the backend is reachable via /api/health.
export const assertApiBaseUsable = async () => {
  const baseURL = api.defaults.baseURL;
  if (!/\/api\/v1\/?$/i.test(baseURL || '')) {
    throw misconfiguredError(baseURL, 'VITE_API_URL must end in /api/v1');
  }
  const origin = baseURL.replace(/\/api\/v1\/?$/i, '');
  try {
    await axios.get(`${origin}/api/health`, { timeout: 15000, withCredentials: false });
    return true;
  } catch (err) {
    throw misconfiguredError(baseURL, err?.message || 'Health check unreachable');
  }
};

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

export const clearOfflineCache = (storageKey) => {
  if (!storageKey) return;
  try { localStorage.removeItem(storageKey); } catch { /* storage may be disabled */ }
};

export const clearAllOfflineCache = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(OFFLINE_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* storage may be disabled */
  }
};

const safeReadAuth = () => {
  try {
    return JSON.parse(localStorage.getItem('cf_auth') || 'null');
  } catch {
    localStorage.removeItem('cf_auth');
    clearAllOfflineCache();
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
        clearAllOfflineCache();
        return Promise.reject(error);
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken: auth.refreshToken },
          { withCredentials: true }
        );

        const updatedAuth = {
          ...auth,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? auth.refreshToken
        };
        localStorage.setItem('cf_auth', JSON.stringify(updatedAuth));

        if (typeof window !== 'undefined' && window.__cf_sync_socket_token) {
          window.__cf_sync_socket_token(data.accessToken);
        }

        processQueue(null, data.accessToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('cf_auth');
        clearAllOfflineCache();
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

    // A 404 straight from the backend's notFound handler ("Route not found: …")
    // usually means the API base lost its /api/v1 suffix, not a bad route —
    // flag it so the UI can show a config message instead of raw text.
    const notFoundMessage = error.response?.data?.message;
    if (
      error.response?.status === 404 &&
      typeof notFoundMessage === 'string' &&
      notFoundMessage.startsWith('Route not found')
    ) {
      error.isApiBaseMisconfigured = true;
    }

    return Promise.reject(error);
  }
);

export default api;
