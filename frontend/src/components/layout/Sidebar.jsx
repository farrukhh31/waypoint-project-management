import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronsLeft, LogOut, X } from 'lucide-react';
import clsx from 'clsx';
import { NAVIGATION, SECONDARY_NAVIGATION } from '../../config/navigation';
import { ROLE_LABELS } from '../../config/roles';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useSidebarPrefs } from '../../hooks/useSidebarPrefs';
import Logo from '../ui/Logo.jsx';
import Avatar from '../ui/Avatar.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';

// role: the signed-in user's role, used to pick the nav item set.
// mobileOpen/onClose: below the lg breakpoint the sidebar becomes an
// off-canvas drawer instead of a static column — PortalLayout owns the
// open/closed state (toggled from Topbar's hamburger) and passes it down.
// The collapse (icon-only) mode stays a desktop-only affordance; a mobile
// drawer is already compact by virtue of being dismissible, so it always
// renders expanded.
export default function Sidebar({ role, mobileOpen = false, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { pathname } = useLocation();
  const items = NAVIGATION[role] || [];
  const secondaryItems = SECONDARY_NAVIGATION[role] || [];
  const { collapsed, setCollapsed } = useSidebarPrefs();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleConfirmLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmLogoutOpen(false);
    }
  }

  function toggleCollapsed() {
    setCollapsed((c) => !c);
  }

  // Close the mobile drawer automatically whenever the route changes —
  // otherwise it'd stay pinned open over the newly-navigated-to page.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Scrim — mobile drawer only, sits under the aside, above the page */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={clsx(
          'fixed inset-0 z-30 bg-ink/50 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      />
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-line bg-surface',
          'transition-transform duration-200 ease-out lg:relative lg:z-auto lg:translate-x-0 lg:transition-[width]',
          mobileOpen ? 'translate-x-0 shadow-2xl shadow-ink/20' : '-translate-x-full',
          collapsed ? 'lg:w-[76px]' : 'lg:w-64'
        )}
      >
      {/* Collapse toggle — floats on the border so it reads as a handle, not a nav item. Desktop only; mobile closes via the scrim or the X below. */}
      <button
        type="button"
        onClick={toggleCollapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-8 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-ink-muted shadow-card transition-colors hover:text-route-600 lg:flex"
      >
        <ChevronsLeft className={clsx('h-3.5 w-3.5 transition-transform duration-200', collapsed && 'rotate-180')} />
      </button>

      {/* Brand header */}
      <div className={clsx('flex items-center justify-between px-5 py-5', collapsed && 'lg:justify-center lg:px-0')}>
        <Logo size="sm" withWordmark={!collapsed} />
        <button
          type="button"
          onClick={onClose}
          title="Close menu"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-paper hover:text-ink lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
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
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'animate-[nav-select_0.25s_ease-out] bg-gradient-to-r from-route-500 to-route-600 text-white shadow-md shadow-route-500/25'
                    : 'text-ink-soft hover:translate-x-0.5 hover:bg-paper hover:text-ink active:scale-[0.98]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      'relative shrink-0 transition-transform duration-200 group-hover:scale-110',
                      isActive && 'scale-110'
                    )}
                  >
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

        {/* Secondary — utility links kept visually apart from the primary
            "Menu" section (Settings today) via a divider line, so the main
            work-nav doesn't get diluted by account-level utilities. */}
        {secondaryItems.length > 0 && (
          <>
            <div className={clsx('my-2 border-t border-line', collapsed ? 'mx-1' : 'mx-1')} />
            {secondaryItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  clsx(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'animate-[nav-select_0.25s_ease-out] bg-paper text-route-600'
                      : 'text-ink-muted hover:translate-x-0.5 hover:bg-paper hover:text-ink-soft active:scale-[0.98]'
                  )
                }
              >
                <Icon className="h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:rotate-45" strokeWidth={2} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Bottom: role tag + theme toggle + mini profile card */}
      <div className="border-t border-line p-3">
        <div
          className={clsx(
            'mb-1 flex items-center px-2 pb-2',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {ROLE_LABELS[role]} portal
            </p>
          )}
          <ThemeToggle className={collapsed ? 'h-7 w-12' : undefined} />
        </div>
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
            onClick={() => setConfirmLogoutOpen(true)}
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

      <ConfirmModal
        open={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
        title="Log out?"
        message="You'll need to sign in again to get back to your dashboard."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
      />
    </>
  );
}
