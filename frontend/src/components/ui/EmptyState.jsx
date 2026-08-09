import { MapPin } from 'lucide-react';

// Used for empty lists — "an empty screen is an invitation to act".
// action is an optional <Button /> element.
export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="route-line-v h-6" aria-hidden="true" />
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-600">
        <MapPin className="h-5 w-5" />
      </div>
      <h3 className="font-display text-base font-medium text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}
