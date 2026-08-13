import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  ShieldCheck,
  CalendarDays,
  UserCog,
  BadgeCheck,
  Briefcase,
  Quote,
  Loader2,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import Avatar from '../ui/Avatar.jsx';
import StatCard from '../ui/StatCard.jsx';
import { ROLE_LABELS, ROLES } from '../../config/roles';
import { formatDate } from '../../utils/formatDate';

// Same three-way palette used across Login, UserCard, and Profile — kept
// in one place per surface since each needs slightly different shades
// (a solid badge here vs. a wash there), but the hue mapping stays fixed:
// red for Admin, indigo for Project Manager, teal for Team Member.
const ROLE_TONE = {
  [ROLES.ADMIN]: {
    accent: 'danger',
    badge: 'bg-danger-50 text-danger-600',
    hero: 'from-danger-600 via-danger-500 to-accent-400',
    ring: 'from-danger-400 via-accent-300 to-danger-500',
    glow: 'shadow-[0_20px_50px_-15px_rgba(240,50,75,0.4)]',
  },
  [ROLES.PROJECT_MANAGER]: {
    accent: 'route',
    badge: 'bg-route-100 text-route-700',
    hero: 'from-route-600 via-route-500 to-accent-400',
    ring: 'from-route-400 via-accent-300 to-route-600',
    glow: 'shadow-[0_20px_50px_-15px_rgba(91,79,224,0.4)]',
  },
  [ROLES.TEAM_MEMBER]: {
    accent: 'teal',
    badge: 'bg-teal-50 text-teal-700',
    hero: 'from-teal-600 via-teal-500 to-accent-300',
    ring: 'from-teal-400 via-accent-300 to-teal-600',
    glow: 'shadow-[0_20px_50px_-15px_rgba(20,201,165,0.4)]',
  },
};

function toHref(url) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function ContactRow({ icon: Icon, label, value, href }) {
  const content = value ? (
    href ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="truncate text-ink hover:text-route-600 hover:underline"
      >
        {value}
      </a>
    ) : (
      <span className="truncate text-ink">{value}</span>
    )
  ) : (
    <span className="truncate text-ink-muted">Not added yet</span>
  );

  return (
    <div className="group/row flex items-center gap-2.5 rounded-xl border border-line/70 bg-paper/60 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-route-200 hover:bg-surface hover:shadow-card">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-muted shadow-sm transition-colors duration-200 group-hover/row:text-route-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <div className="text-sm">{content}</div>
      </div>
    </div>
  );
}

// Fetches the target user fresh on open (rather than trusting whatever's in
// the grid item) so edits made moments earlier are always reflected. This is
// a bespoke dialog rather than the generic <Modal> — a profile deserves a
// dedicated stage (role-tinted hero, spinning gradient avatar ring) that the
// shared chrome-y modal wasn't built for.
export default function UserProfileModal({ userId, open, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !userId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get(`/users/${userId}`)
      .then(({ data }) => {
        if (!cancelled) setUser(data.data.user);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load this profile.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  useEffect(() => {
    if (!open) setUser(null);
  }, [open]);

  if (!open) return null;

  const tone = ROLE_TONE[user?.role] || ROLE_TONE[ROLES.TEAM_MEMBER];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="User profile"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 z-20 rounded-full bg-surface/80 p-2 text-ink-muted shadow-card backdrop-blur transition-all duration-300 hover:rotate-90 hover:bg-surface hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-y-auto">
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-route-400" />
            </div>
          ) : error ? (
            <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-ink-muted">
              {error}
            </div>
          ) : user ? (
            <>
              {/* Role-tinted hero — the dialog's identity strip, matching whichever
                  role this person holds rather than a fixed brand gradient. */}
              <div className={clsx('relative h-28 overflow-hidden bg-gradient-to-r', tone.hero)}>
                <div className="route-line absolute inset-x-0 bottom-0 h-6 opacity-20" aria-hidden="true" />
                <div
                  className="animate-glow-pulse absolute -right-8 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl"
                  aria-hidden="true"
                />
                <div
                  className="animate-aurora-b absolute -left-10 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-2xl"
                  aria-hidden="true"
                />
              </div>

              <div className="px-6 pb-6">
                <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                  {/* Slowly rotating conic-gradient ring around the avatar — the
                      one flourish reserved for this "showcase" moment; nowhere
                      else in the app spins. */}
                  <div className={clsx('relative shrink-0 rounded-full', tone.glow)}>
                    <div
                      className={clsx(
                        'animate-[wp-spin_7s_linear_infinite] rounded-full bg-gradient-to-tr p-[3px]',
                        tone.ring
                      )}
                    >
                      <div className="rounded-full bg-surface p-1">
                        <Avatar name={user.name} src={user.avatarUrl} size="lg" className="h-24 w-24 text-2xl" />
                      </div>
                    </div>
                    <span
                      className={clsx(
                        'absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border-2 border-surface',
                        user.isActive ? 'bg-success-400' : 'bg-ink-muted/50'
                      )}
                      title={user.isActive ? 'Active' : 'Inactive'}
                    />
                  </div>

                  <div className="min-w-0 flex-1 pb-1 animate-[fade-in-up_0.35s_ease-out_0.05s_both]">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-xl font-semibold text-ink">{user.name}</p>
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                          tone.badge
                        )}
                      >
                        <BadgeCheck className="h-3 w-3" /> {ROLE_LABELS[user.role]}
                      </span>
                    </div>
                    {user.jobTitle && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                        <Briefcase className="h-3.5 w-3.5 shrink-0" />
                        {user.jobTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-sm text-ink-muted animate-[fade-in-up_0.35s_ease-out_0.1s_both]">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <a href={`mailto:${user.email}`} className="truncate hover:text-route-600 hover:underline">
                    {user.email}
                  </a>
                </div>

                {user.bio && (
                  <div
                    className={clsx(
                      'relative mt-4 overflow-hidden rounded-xl border border-line/70 bg-paper/60 py-3 pl-9 pr-4 animate-[fade-in-up_0.35s_ease-out_0.14s_both]'
                    )}
                  >
                    <Quote className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-muted/40" />
                    <p className="text-sm italic leading-relaxed text-ink-soft">{user.bio}</p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 animate-[fade-in-up_0.35s_ease-out_0.18s_both]">
                  <ContactRow icon={Phone} label="Phone" value={user.phone} />
                  <ContactRow icon={MapPin} label="Location" value={user.location} />
                  <ContactRow icon={Linkedin} label="LinkedIn" value={user.linkedinUrl} href={toHref(user.linkedinUrl)} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3 animate-[fade-in-up_0.35s_ease-out_0.22s_both]">
                  <StatCard label="Role" value={ROLE_LABELS[user.role]} icon={ShieldCheck} accent={tone.accent} tilt />
                  <StatCard label="Member since" value={formatDate(user.createdAt)} icon={CalendarDays} accent="sky" tilt />
                  {user.role === ROLES.PROJECT_MANAGER ? (
                    <StatCard
                      label="Invite permission"
                      value={user.canInviteMembers ? 'Granted' : 'Not granted'}
                      icon={UserCog}
                      accent={user.canInviteMembers ? 'success' : 'accent'}
                      tilt
                    />
                  ) : (
                    <StatCard
                      label="Account status"
                      value={user.isActive ? 'Active' : 'Inactive'}
                      icon={UserCog}
                      accent={user.isActive ? 'success' : 'danger'}
                      tilt
                    />
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}