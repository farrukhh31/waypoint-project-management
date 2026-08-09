import { Search } from 'lucide-react';
import Input from '../ui/Input.jsx';

export function Toolbar({ children }) {
  return <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>;
}

export function SearchField({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

export function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-route-500 focus:outline-none focus:ring-1 focus:ring-route-500"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
