import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { NAVIGATION } from '../../config/navigation';

// Lightweight quick-jump across this role's own pages — not a backend
// search. Widening this to projects/tasks/users would mean querying the
// API on every keystroke, which belongs in its own component once there's
// a debounced backend endpoint to call; for now this keeps the Topbar's
// search box honest about what it actually does.
export default function GlobalSearch({ role }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const items = NAVIGATION[role] || [];
  const matches = query.trim()
    ? items.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  useEffect(() => {
    function handleShortcut(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  function go(item) {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    navigate(item.path);
  }

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) go(matches[0]);
        }}
        type="text"
        placeholder="Jump to a page…"
        className="h-10 w-full rounded-full border border-line bg-paper pl-10 pr-14 text-sm text-ink placeholder:text-ink-muted transition-shadow focus:border-route-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-route-500/10"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
        ⌘K
      </kbd>

      {open && matches.length > 0 && (
        <div className="absolute left-0 top-12 z-20 w-full origin-top overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-pop animate-modal-pop">
          {matches.map((item, i) => (
            <button
              key={item.path}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(item)}
              style={{ animationDelay: `${i * 25}ms` }}
              className="flex w-full animate-[fade-in-up_0.2s_ease-out_both] items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-soft transition-colors duration-150 hover:bg-paper hover:text-ink"
            >
              <item.icon className="h-4 w-4 text-ink-muted" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
