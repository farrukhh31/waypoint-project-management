import { Pencil, Trash2, Mail, Briefcase as BriefcaseIcon, ShieldCheck, Briefcase, Users as UsersIcon, Eye } from 'lucide-react';
import clsx from 'clsx';
import Card from '../ui/Card.jsx';
import Avatar from '../ui/Avatar.jsx';
import TiltCard from '../ui/TiltCard.jsx';
import { ROLES, ROLE_LABELS } from '../../config/roles';
import { useScrollReveal } from '../../hooks/useScrollReveal';

// Same three-way palette as the Login role selector and Profile's role
// badge, so "Administrator" reads as the same color everywhere in the app.
// `glow` is written as the full hover-state class (not composed at runtime)
// so Tailwind's JIT scanner can actually find and generate it.
const ROLE_TONE = {
  [ROLES.ADMIN]: {
    icon: ShieldCheck,
    bar: 'bg-danger-400',
    wash: 'from-danger-50',
    ring: 'ring-danger-300/60',
    border: 'group-hover:border-danger-200',
    glow: 'group-hover:shadow-[0_18px_40px_-12px_rgba(240,50,75,0.35)]',
    badge: 'bg-danger-50 text-danger-600',
  },
  [ROLES.PROJECT_MANAGER]: {
    icon: Briefcase,
    bar: 'bg-route-500',
    wash: 'from-route-50',
    ring: 'ring-route-300/60',
    border: 'group-hover:border-route-200',
    glow: 'group-hover:shadow-[0_18px_40px_-12px_rgba(91,79,224,0.35)]',
    badge: 'bg-route-100 text-route-700',
  },
  [ROLES.TEAM_MEMBER]: {
    icon: UsersIcon,
    bar: 'bg-teal-400',
    wash: 'from-teal-50',
    ring: 'ring-teal-300/60',
    border: 'group-hover:border-teal-200',
    glow: 'group-hover:shadow-[0_18px_40px_-12px_rgba(20,201,165,0.35)]',
    badge: 'bg-teal-50 text-teal-700',
  },
};

export default function UserCard({ user, canManage, isSelf, onView, onEdit, onDelete, deleting, style }) {
  const tone = ROLE_TONE[user.role] || ROLE_TONE[ROLES.TEAM_MEMBER];
  const RoleIcon = tone.icon;
  const [revealRef, revealed] = useScrollReveal();

  function stop(e, fn) {
    e.preventDefault();
    e.stopPropagation();
    fn?.(user);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onView?.(user);
    }
  }

  return (
    <div
      ref={revealRef}
      style={style}
      className={clsx(
        'transition-all duration-500 ease-out',
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <TiltCard maxTilt={5} className="block h-full rounded-lg">
        <Card
          role="button"
          tabIndex={0}
          onClick={() => onView?.(user)}
          onKeyDown={handleKeyDown}
          aria-label={`View ${user.name}'s profile`}
          className={clsx(
            'card-sheen group relative flex h-full cursor-pointer flex-col overflow-hidden p-0 outline-none transition-all duration-300',
            'hover:-translate-y-1.5 focus-visible:-translate-y-1.5',
            tone.border,
            tone.glow,
            deleting && 'pointer-events-none opacity-50'
          )}
        >
          {/* Quiet role-tinted wash that blooms in on hover */}
          <div
            className={clsx(
              'pointer-events-none absolute inset-0 bg-gradient-to-br via-surface to-surface opacity-0 transition-opacity duration-300 group-hover:opacity-100',
              tone.wash
            )}
            aria-hidden="true"
          />

          {/* Role accent bar */}
          <div className={clsx('relative h-[3px] w-full shrink-0', tone.bar)} />

          {/* Quick actions — scale + fade in on hover only, never steal the card click */}
          {canManage && (
            <div className="absolute right-3 top-4 z-10 flex items-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => stop(e, onEdit)}
                aria-label={`Edit ${user.name}`}
                className="scale-90 rounded-md bg-surface/90 p-1.5 text-ink-muted shadow-card backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-route-50 hover:text-route-600 group-hover:scale-100"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {!isSelf && (
                <button
                  type="button"
                  onClick={(e) => stop(e, onDelete)}
                  aria-label={`Delete ${user.name}`}
                  className="scale-90 rounded-md bg-surface/90 p-1.5 text-ink-muted shadow-card backdrop-blur transition-all delay-[30ms] duration-200 hover:scale-105 hover:bg-danger-50 hover:text-danger-600 group-hover:scale-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="relative flex flex-1 flex-col items-center gap-3 px-5 pb-5 pt-6 text-center">
            <div
              className={clsx(
                'relative rounded-full ring-4 ring-offset-2 ring-offset-surface transition-all duration-300 group-hover:scale-110',
                tone.ring
              )}
            >
              <Avatar name={user.name} src={user.avatarUrl} size="lg" className="h-16 w-16 text-lg" />
              <span
                className={clsx(
                  'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-surface transition-transform duration-300 group-hover:scale-110',
                  user.isActive ? 'bg-success-400' : 'bg-ink-muted/50'
                )}
                title={user.isActive ? 'Active' : 'Inactive'}
              />
            </div>

            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-ink transition-colors duration-200 group-hover:text-route-700">
                {user.name}
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1 truncate text-xs text-ink-muted">
                <Mail className="h-3 w-3 shrink-0" />
                {user.email}
              </p>
            </div>

            {user.jobTitle && (
              <p className="flex items-center gap-1 truncate text-xs text-ink-soft">
                <BriefcaseIcon className="h-3 w-3 shrink-0" />
                {user.jobTitle}
              </p>
            )}

            <div className="mt-auto flex items-center gap-2 pt-1">
              <span
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  tone.badge
                )}
              >
                <RoleIcon className="h-3 w-3" />
                {ROLE_LABELS[user.role]}
              </span>
              <span
                className={clsx(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  user.isActive ? 'bg-success-50 text-success-600' : 'bg-ink-muted/10 text-ink-soft'
                )}
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* "View profile" affordance — quietly slides up into view on hover,
                signalling the whole card is clickable without cluttering it at rest. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-1.5 bg-gradient-to-t from-surface via-surface/95 to-transparent pb-2.5 pt-5 text-xs font-medium text-route-600 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <Eye className="h-3 w-3" />
              View profile
            </div>
          </div>
        </Card>
      </TiltCard>
    </div>
  );
}