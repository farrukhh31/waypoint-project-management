import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronsLeft, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { NAVIGATION } from '../../config/navigation';
import { ROLE_LABELS } from '../../config/roles';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import Logo from '../ui/Logo.jsx';
import Avatar from '../ui/Avatar.jsx';

const COLLAPSE_KEY = 'waypoint:sidebar-collapsed';

function readInitialCollapsed() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(COLLAPSE_KEY) === '1';
}

export default function Sidebar({ role }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const items = NAVIGATION[role] || [];
  const [collapsed, setCollapsed] = useState(readInitialCollapsed);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  }

  return (
    <aside
      className={clsx(
        'relative flex h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 ease-out',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Collapse toggle — floats on the border so it reads as a handle, not a nav item */}
      <button
        type="button"
        onClick={toggleCollapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-ink-muted shadow-card transition-colors hover:text-route-600"
      >
        <ChevronsLeft className={clsx('h-3.5 w-3.5 transition-transform duration-200', collapsed && 'rotate-180')} />
      </button>

      {/* Brand header */}
      <div className={clsx('flex items-center px-5 py-5', collapsed && 'justify-center px-0')}>
        <Logo size="sm" withWordmark={!collapsed} />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {!collapsed && (
          <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Menu
          </p>
        )}
        {items.map(({ label, path, icon: Icon, end }) => {
          const showBadge = label === 'Notifications' && unreadCount > 0;
          return (
            <NavLink
              key={path}
              to={path}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-gradient-to-r from-route-500 to-route-600 text-white shadow-md shadow-route-500/25'
                    : 'text-ink-soft hover:bg-paper hover:text-ink'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative shrink-0">
                    <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                    {showBadge && collapsed && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-400 ring-2 ring-surface" />
                    )}
                  </span>
                  {!collapsed && (
                    <span className="flex flex-1 items-center justify-between">
                      {label}
                      {showBadge && (
                        <span
                          className={clsx(
                            'flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none',
                            isActive ? 'bg-white/25 text-white' : 'bg-accent-400 text-white'
                          )}
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: role tag + mini profile card */}
      <div className="border-t border-line p-3">
        {!collapsed && (
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            {ROLE_LABELS[role]} portal
          </p>
        )}
        <div
          className={clsx(
            'flex items-center gap-2.5 rounded-xl bg-paper px-2.5 py-2.5',
            collapsed && 'justify-center px-0'
          )}
        >
          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{user.name}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            title="Log out"
            className={clsx(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-danger-50 hover:text-danger-600',
              collapsed && 'hidden'
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
