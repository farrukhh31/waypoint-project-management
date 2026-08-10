import { createContext, useCallback, useEffect, useState } from 'react';

const COLLAPSE_KEY = 'waypoint:sidebar-collapsed';

export const SidebarPrefsContext = createContext(null);

function readInitialCollapsed() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(COLLAPSE_KEY) === '1';
}

// Single source of truth for the sidebar's collapsed/expanded state, so it
// can be flipped from two different places — the collapse handle on the
// sidebar itself, and the "Compact sidebar" switch in Settings — and stay
// in sync between them without a page reload.
export function SidebarPrefsProvider({ children }) {
  const [collapsed, setCollapsedState] = useState(readInitialCollapsed);

  const setCollapsed = useCallback((value) => {
    setCollapsedState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  // Keep in sync if it's changed in another tab.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === COLLAPSE_KEY) setCollapsedState(e.newValue === '1');
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <SidebarPrefsContext.Provider value={{ collapsed, setCollapsed }}>{children}</SidebarPrefsContext.Provider>
  );
}
