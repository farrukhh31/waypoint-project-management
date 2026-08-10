import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderPlus, UserPlus, ListPlus } from 'lucide-react';
import clsx from 'clsx';
import { ROLES } from '../../config/roles';

const ACTIONS = {
  [ROLES.ADMIN]: [
    { label: 'New project', hint: 'Start something new', icon: FolderPlus, to: (home) => `${home}/projects?new=1` },
    { label: 'New task', hint: 'Assign work to the team', icon: ListPlus, to: (home) => `${home}/tasks?new=1` },
    { label: 'Invite user', hint: 'Bring someone onto the team', icon: UserPlus, to: (home) => `${home}/users?invite=1` },
  ],
  [ROLES.PROJECT_MANAGER]: [
    { label: 'New task', hint: 'Assign work to the team', icon: ListPlus, to: (home) => `${home}/tasks?new=1` },
  ],
};

export default function QuickCreateMenu({ role, homePath }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const actions = ACTIONS[role];

  if (!actions || actions.length === 0) return null;

  function handleSelect(action) {
    setOpen(false);
    navigate(action.to(homePath));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 rounded-full bg-route-500 pl-3 pr-3.5 text-sm font-medium text-white shadow-sm shadow-route-500/25 transition-all duration-150 hover:bg-route-600 hover:shadow-md active:scale-95"
      >
        <Plus className={clsx('h-4 w-4 transition-transform duration-200', open && 'rotate-45')} />
        <span className="hidden sm:inline">Create</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 w-64 origin-top-right overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-pop animate-modal-pop">
            {actions.map(({ label, hint, icon: Icon, to }, i) => (
              <button
                key={label}
                type="button"
                onClick={() => handleSelect({ to })}
                style={{ animationDelay: `${i * 30}ms` }}
                className="group flex w-full animate-[fade-in-up_0.25s_ease-out_both] items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-paper"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-route-50 text-route-600 transition-transform duration-150 group-hover:scale-110">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">{label}</span>
                  <span className="block text-xs text-ink-muted">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
