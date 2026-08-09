import axios from 'axios';
import { startLoading, stopLoading } from './loadingBus';

// The backend issues a short-lived JWT access token (kept in memory here,
// not localStorage — avoids XSS token theft) plus a rotating refresh token
// in an httpOnly cookie scoped to /api/auth, so refresh calls just need
// `withCredentials: true` and no token handling on our end.

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let accessToken = null;
let onUnauthorized = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// App.jsx registers this so a hard-expired session can redirect to /login
// without api.js needing to know about the router.
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    startLoading();
    return config;
  },
  (error) => {
    stopLoading();
    return Promise.reject(error);
  }
);

let refreshPromise = null;

api.interceptors.response.use(
  (response) => {
    stopLoading();
    return response;
  },
  async (error) => {
    stopLoading();
    const { config, response } = error;
    const isAuthRoute = config?.url?.startsWith('/auth/');

    if (response?.status === 401 && !config._retried && !isAuthRoute) {
      config._retried = true;
      try {
        // De-dupe concurrent 401s into a single refresh call.
        refreshPromise = refreshPromise || api.post('/auth/refresh');
        const { data } = await refreshPromise;
        refreshPromise = null;
        setAccessToken(data.data.accessToken);
        config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(config);
      } catch (refreshError) {
        refreshPromise = null;
        setAccessToken(null);
        onUnauthorized();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
