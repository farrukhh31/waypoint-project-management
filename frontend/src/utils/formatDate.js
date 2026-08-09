export function formatDueDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const today = new Date();
  const diffDays = Math.round((date.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / 86400000);

  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return `Due in ${diffDays}d`;
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// HH:MM:SS (or MM:SS under an hour) for a running/paused timer's elapsed seconds.
export function formatClock(totalSeconds = 0) {
  const s = Math.max(Math.floor(totalSeconds), 0);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

// "2h ago" / "3d ago" style relative timestamp for activity feeds
// (submissions, review decisions) where the recency matters more than the
// exact date. Falls back to formatDate once it's more than a week old.
export function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 45) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(isoString);
}

// Clock time for a meeting row, e.g. "8:30 AM".
export function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// Where along a start->end date span "today" sits, clamped to [0, 100].
// Drives the little route pin used on project cards/details — the same
// "progress along a route" motif used everywhere else in the app.
export function timeElapsedPct(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}
