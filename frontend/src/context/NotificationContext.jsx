import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../hooks/useAuth';

export const NotificationContext = createContext(null);

// Notification is a single top-level piece of state so the bell's badge
// count and the full Notifications page always agree, and so a socket push
// doesn't require every consumer to run its own fetch/listener pair.
export function NotificationProvider({ children }) {
  const { status } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const listenerAttached = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data.notifications ?? []);
      setUnreadCount(data.data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      setNotifications([]);
      setUnreadCount(0);
      listenerAttached.current = false;
      return undefined;
    }

    load();

    // AuthContext connects the socket right after login/refresh resolves,
    // which can land a beat after this effect runs — poll briefly for it
    // rather than threading socket lifecycle through two contexts.
    let pollId;
    const handler = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
    };
    const tryAttach = () => {
      const socket = getSocket();
      if (!socket) return false;
      socket.on('notification:new', handler);
      listenerAttached.current = true;
      return true;
    };

    if (!tryAttach()) {
      pollId = setInterval(() => {
        if (tryAttach()) clearInterval(pollId);
      }, 300);
    }

    return () => {
      if (pollId) clearInterval(pollId);
      getSocket()?.off('notification:new', handler);
      listenerAttached.current = false;
    };
  }, [status, load]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await api.patch(`/notifications/${id}/read`);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await api.patch('/notifications/read-all');
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markRead, markAllRead, refresh: load }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
