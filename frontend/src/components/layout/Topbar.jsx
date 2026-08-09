import { useState } from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME, ROLE_LABELS } from '../../config/roles';
import Avatar from '../ui/Avatar.jsx';
import NotificationBell from './NotificationBell.jsx';
import GlobalSearch from './GlobalSearch.jsx';
import QuickCreateMenu from './QuickCreateMenu.jsx';

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const homePath = ROLE_HOME[user.role];

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-surface px-6">
      <h1 className="hidden shrink-0 font-display text-lg font-semibold text-ink lg:block">{title}</h1>

      <div className="flex flex-1 justify-center lg:justify-start">
        <GlobalSearch role={user.role} />
      </div>

      <div className="flex items-center gap-2.5">
        <QuickCreateMenu role={user.role} homePath={homePath} />
        <NotificationBell homePath={homePath} />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 hover:bg-paper"
          >
            <span className="rounded-full ring-2 ring-route-100">
              <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-ink">{user.name}</span>
              <span className="block text-[11px] leading-tight text-ink-muted">{ROLE_LABELS[user.role]}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-3">
                <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                  <p className="truncate text-xs text-ink-muted">{user.email}</p>
                </div>
              </div>
              <Link
                to={`${homePath}/profile`}
                className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-ink-soft hover:bg-paper"
                onClick={() => setMenuOpen(false)}
              >
                <User className="h-4 w-4" /> Profile
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-50"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
