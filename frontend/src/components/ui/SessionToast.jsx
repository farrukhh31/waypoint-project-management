import { useEffect, useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../config/roles';

const DURATION = 4200;

function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || name;
}

// Fires once per real login/logout action (see AuthContext's sessionEvent —
// never on a silent page-refresh re-auth). Mounted once near the app root
// so it survives route changes and layout switches.
export default function SessionToast() {
  const { sessionEvent, clearSessionEvent, user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!sessionEvent) return undefined;
    setVisible(true);
    setLeaving(false);

    const leaveTimer = setTimeout(() => setLeaving(true), DURATION - 300);
    const clearTimer = setTimeout(() => {
      setVisible(false);
      clearSessionEvent();
    }, DURATION);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(clearTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEvent]);

  if (!visible || !sessionEvent) return null;

  const isLogin = sessionEvent.type === 'login';
  const roleLabel = isLogin && user ? ROLE_LABELS[user.role] : null;

  function dismiss() {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      clearSessionEvent();
    }, 250);
  }

  return (
    <div
      className={clsx(
        'fixed bottom-5 right-5 z-[100] w-[min(340px,calc(100vw-2.5rem))]',
        leaving ? 'animate-[fade-in-up_0.25s_ease-out_reverse_both]' : 'animate-modal-pop'
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={clsx(
          'card-sheen relative flex items-center gap-3 overflow-hidden rounded-xl border p-3.5 shadow-pop backdrop-blur-md',
          isLogin
            ? 'border-route-400/30 bg-gradient-to-br from-route-500/[0.09] via-surface/95 to-surface/95'
            : 'border-line bg-surface/95'
        )}
      >
        {/* Ambient glow, login only — quiet accent to distinguish the two states */}
        {isLogin && (
          <span
            className="animate-glow-pulse pointer-events-none absolute -left-6 -top-6 h-20 w-20 rounded-full bg-route-400/20 blur-xl"
            aria-hidden="true"
          />
        )}

        <span
          className={clsx(
            'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-md',
            isLogin ? 'bg-gradient-to-br from-route-500 to-route-600 shadow-route-500/30' : 'bg-ink-muted/70'
          )}
        >
          {isLogin ? <LogIn className="h-4.5 w-4.5" strokeWidth={2.25} /> : <LogOut className="h-4.5 w-4.5" strokeWidth={2.25} />}
        </span>

        <div className="relative min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold text-ink">
            {isLogin ? `Welcome back, ${firstName(sessionEvent.name)}` : `See you soon, ${firstName(sessionEvent.name)}`}
          </p>
          <p className="truncate text-xs text-ink-muted">
            {isLogin ? `Signed in as ${roleLabel ?? 'your account'}` : 'You\u2019ve been signed out'}
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="relative shrink-0 rounded-full p-1 text-ink-muted transition-colors hover:bg-ink-muted/10 hover:text-ink"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>

        {/* Auto-dismiss progress rail */}
        <span
          className={clsx('absolute inset-x-0 bottom-0 h-0.5 origin-left', isLogin ? 'bg-route-400/60' : 'bg-ink-muted/40')}
          style={{ animation: `wp-toast-shrink ${DURATION}ms linear forwards` }}
        />
      </div>
    </div>
  );
}