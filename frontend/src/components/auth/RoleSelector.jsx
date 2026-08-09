import { ShieldCheck, Briefcase, Users } from 'lucide-react';
import clsx from 'clsx';
import { ROLES, ROLE_LABELS } from '../../config/roles';

// Same three-way palette used across the app (UserCard, UserProfileModal,
// Login) — red for Admin, indigo for Project Manager, teal for Team Member —
// so a person's portal reads as the same color everywhere.
const OPTIONS = [
  { value: ROLES.TEAM_MEMBER, label: ROLE_LABELS[ROLES.TEAM_MEMBER], icon: Users, active: 'from-teal-500 to-teal-600 shadow-teal-500/30' },
  { value: ROLES.PROJECT_MANAGER, label: ROLE_LABELS[ROLES.PROJECT_MANAGER], icon: Briefcase, active: 'from-route-500 to-route-600 shadow-route-500/30' },
  { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN], icon: ShieldCheck, active: 'from-danger-500 to-danger-600 shadow-danger-500/30' },
];

export default function RoleSelector({ value, onChange }) {
  const activeIndex = OPTIONS.findIndex((o) => o.value === value);
  const active = OPTIONS[activeIndex] ?? OPTIONS[0];

  return (
    <div role="radiogroup" aria-label="Sign in as" className="rounded-xl border border-line bg-paper/70 p-1.5 shadow-inner">
      <div className="relative grid grid-cols-3 gap-1">
        {/* Sliding highlight — glides under the active option instead of the
            options just toggling color, the one bit of "alive" motion on an
            otherwise static form. */}
        <div
          className={clsx(
            'absolute inset-y-0 w-1/3 rounded-lg bg-gradient-to-br shadow-lg transition-all duration-300 ease-out',
            active.active
          )}
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
          aria-hidden="true"
        />

        {OPTIONS.map((opt) => {
          const isActive = opt.value === value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(opt.value)}
              className={clsx(
                'relative z-10 flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-xs font-medium transition-colors duration-200',
                isActive ? 'text-white' : 'text-ink-muted hover:text-ink-soft'
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}