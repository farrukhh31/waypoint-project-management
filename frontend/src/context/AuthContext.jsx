import { createContext, useCallback, useEffect, useState } from 'react';
import api, { setAccessToken, setUnauthorizedHandler } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'guest'
  // Drives the bottom-right session toast. Only set on an explicit login/
  // logout action (not the silent refresh-on-page-load below), so it
  // greets someone once per real sign-in rather than on every reload.
  const [sessionEvent, setSessionEvent] = useState(null);
  const clearSessionEvent = useCallback(() => setSessionEvent(null), []);

  const clearSession = useCallback((name) => {
    setAccessToken(null);
    disconnectSocket();
    setUser(null);
    setStatus('guest');
    if (name) setSessionEvent({ type: 'logout', name, id: Date.now() });
  }, []);

  // On first load there's no access token in memory yet, but the httpOnly
  // refresh cookie may still be valid — try it once so a page refresh
  // doesn't bounce an already-logged-in user back to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => clearSession());

    (async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.data.accessToken);
        const me = await api.get('/auth/me');
        setUser(me.data.data.user);
        setStatus('authenticated');
        connectSocket();
      } catch {
        setStatus('guest');
      }
    })();
  }, [clearSession]);

  // Returns { user } on a normal login, or { requiresTwoFactor: true, mfaToken }
  // when the account has 2FA on — the caller (Login page) then collects a
  // code and calls verifyTwoFactor to finish. `role` is the portal picked on
  // the login screen — a UX check the server verifies against the account's
  // real role; see authController.login for why it can never grant access.
  const login = useCallback(async (email, password, role) => {
    const { data } = await api.post('/auth/login', { email, password, role });
    if (data.data.requiresTwoFactor) {
      return { requiresTwoFactor: true, mfaToken: data.data.mfaToken };
    }
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    setStatus('authenticated');
    connectSocket();
    setSessionEvent({ type: 'login', name: data.data.user.name, id: Date.now() });
    return { user: data.data.user };
  }, []);

  const verifyTwoFactor = useCallback(async (mfaToken, code) => {
    const { data } = await api.post('/auth/verify-2fa', { mfaToken, code });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    setStatus('authenticated');
    connectSocket();
    setSessionEvent({ type: 'login', name: data.data.user.name, id: Date.now() });
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    const name = user?.name;
    try {
      await api.post('/auth/logout');
    } finally {
      clearSession(name);
    }
  }, [clearSession, user]);

  const refreshMe = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.data.user);
    return data.data.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, status, login, verifyTwoFactor, logout, refreshMe, sessionEvent, clearSessionEvent }}
    >
      {children}
    </AuthContext.Provider>
  );
}