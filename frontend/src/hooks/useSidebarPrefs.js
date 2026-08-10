import { useContext } from 'react';
import { SidebarPrefsContext } from '../context/SidebarPrefsContext.jsx';

export function useSidebarPrefs() {
  const ctx = useContext(SidebarPrefsContext);
  if (!ctx) throw new Error('useSidebarPrefs must be used within a SidebarPrefsProvider');
  return ctx;
}
