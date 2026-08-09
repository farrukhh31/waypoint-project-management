import clsx from 'clsx';
import Avatar from './Avatar.jsx';

// Overlapping avatar cluster for a project's team. Shows up to `max` people,
// then a "+N" chip for the rest. Each avatar gets a surface ring so they read
// as distinct discs even when stacked tightly, and fans out slightly on
// group-hover (driven by the parent card's `group` class) to feel alive
// without needing per-avatar JS.
export default function AvatarStack({ people = [], max = 4, size = 'sm' }) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  if (people.length === 0) {
    return <p className="text-xs text-ink-muted">No members yet</p>;
  }

  return (
    <div className="flex items-center -space-x-2.5">
      {visible.map((person, i) => (
        <span
          key={person.id}
          className="relative transition-transform duration-200 ease-out group-hover:translate-x-0"
          style={{ transitionDelay: `${i * 30}ms`, zIndex: visible.length - i }}
          title={person.name}
        >
          <Avatar
            name={person.name}
            size={size}
            className={clsx(
              'ring-2 ring-surface transition-shadow duration-200 group-hover:ring-route-100'
            )}
          />
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="relative flex h-7 w-7 items-center justify-center rounded-full bg-ink-muted/15 text-[11px] font-medium text-ink-soft ring-2 ring-surface"
          style={{ zIndex: 0 }}
          title={`${overflow} more`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
