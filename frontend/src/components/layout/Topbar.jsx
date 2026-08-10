import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Menu, Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME, ROLE_LABELS } from '../../config/roles';
import Avatar from '../ui/Avatar.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import NotificationBell from './NotificationBell.jsx';
import GlobalSearch from './GlobalSearch.jsx';
import QuickCreateMenu from './QuickCreateMenu.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';

export default function Topbar({ title, onOpenMenu = () => {} }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const homePath = ROLE_HOME[user.role];

  async function handleConfirmLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmLogoutOpen(false);
    }
  }

  // Outside click + Escape close it — kept mounted (not conditionally
  // rendered) so the open/close transition below can actually animate
  // instead of popping in and out.
  useEffect(() => {
    if (!menuOpen) return undefined;
    function handlePointer(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    }
    function handleKey(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        title="Open menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-paper hover:text-ink lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1
        key={title}
        className="hidden shrink-0 animate-[fade-in-up_0.3s_ease-out_both] font-display text-lg font-semibold text-ink lg:block"
      >
        {title}
      </h1>

      <div className="flex flex-1 justify-center lg:justify-start">
        <GlobalSearch role={user.role} />
      </div>

      <div className="flex items-center gap-2.5">
        <QuickCreateMenu role={user.role} homePath={homePath} />
        <ThemeToggle className="hidden sm:inline-flex" />
        <NotificationBell homePath={homePath} />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            className={clsx(
              'flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors duration-200',
              menuOpen ? 'bg-paper' : 'hover:bg-paper'
            )}
          >
            <span
              className={clsx(
                'rounded-full bg-gradient-to-br from-route-400 to-route-600 p-[1.5px] transition-shadow duration-200',
                menuOpen && 'shadow-md shadow-route-500/30'
              )}
            >
              <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-ink">{user.name}</span>
              <span className="block text-[11px] leading-tight text-ink-muted">{ROLE_LABELS[user.role]}</span>
            </span>
            <ChevronDown
              className={clsx(
                'h-3.5 w-3.5 text-ink-muted transition-transform duration-200',
                menuOpen && 'rotate-180 text-route-600'
              )}
            />
          </button>

          {/* Always mounted so the transition actually plays both ways;
              invisible + pointer-events-none keeps it out of tab order
              and unclickable while closed. */}
          <div
            role="menu"
            className={clsx(
              'absolute right-0 top-[calc(100%+10px)] z-20 w-64 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-pop backdrop-blur-xl transition-all duration-200 ease-out',
              menuOpen
                ? 'visible translate-y-0 scale-100 opacity-100'
                : 'invisible pointer-events-none -translate-y-1 scale-95 opacity-0'
            )}
          >
            {/* Identity banner — brand gradient + soft decorative blobs so the
                menu opens with a bit of presence instead of a plain list. */}
            <div className="relative overflow-hidden bg-gradient-to-br from-route-500 to-route-600 px-4 pb-4 pt-4">
              <div className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-9 -left-5 h-20 w-20 rounded-full bg-white/10" />
              <div className="relative flex items-center gap-3">
                <span className="rounded-full ring-2 ring-white/40">
                  <Avatar name={user.name} src={user.avatarUrl} size="md" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-white/75">{user.email}</p>
                </div>
              </div>
              <span className="relative mt-3 inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                {ROLE_LABELS[user.role]}
              </span>
            </div>

            <div className="p-1.5">
              <Link
                to={`${homePath}/profile`}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition-colors duration-150 hover:bg-paper hover:text-ink"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-route-50 text-route-600 transition-colors duration-150 group-hover:bg-route-100">
                  <User className="h-4 w-4" />
                </span>
                Profile
              </Link>
              <Link
                to={`${homePath}/settings`}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition-colors duration-150 hover:bg-paper hover:text-ink"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 transition-colors duration-150 group-hover:bg-sky-100">
                  <Settings className="h-4 w-4" />
                </span>
                Settings
              </Link>

              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 sm:hidden">
                <span className="text-sm text-ink-soft">Theme</span>
                <ThemeToggle />
              </div>

              <div className="my-1 border-t border-line" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmLogoutOpen(true);
                }}
                className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-danger-600 transition-colors duration-150 hover:bg-danger-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger-50 text-danger-600 transition-colors duration-150 group-hover:bg-danger-100">
                  <LogOut className="h-4 w-4" />
                </span>
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>

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
    </header>
  );
}
