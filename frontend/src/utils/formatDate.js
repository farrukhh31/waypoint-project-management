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

// Deadline urgency for highlighting, one level up from just "overdue":
// 'overdue' (past due, still open), 'soon' (due today/tomorrow, or within
// DUE_SOON_DAYS — the window a task is genuinely "touching" its deadline),
// or 'normal' otherwise. Completed tasks are never flagged, whatever their
// due date — highlighting is about what still needs attention.
const DUE_SOON_DAYS = 2;

export function getDeadlineUrgency(isoString, status) {
  if (!isoString || status === 'COMPLETED') return 'normal';
  const date = new Date(isoString);
  const today = new Date();
  const diffDays = Math.round((date.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / 86400000);

  if (diffDays < 0) return 'overdue';
  if (diffDays <= DUE_SOON_DAYS) return 'soon';
  return 'normal';
}

// Real-time (hour-precision) check for a deadline landing within the next
// 24 hours — a tighter, exact-hours window than `getDeadlineUrgency`'s
// day-granular 'soon' bucket. Drives the same "about to happen" blink
// treatment meetings already get (see `.urgent-blink` in index.css) on
// task and project deadline cards, plus the dashboard's urgent-deadlines
// counter. Only counts deadlines still in the future and still open —
// something already overdue or done isn't "about to" happen anymore.
export function isDeadlineCritical(isoString, status) {
  if (!isoString || status === 'COMPLETED' || status === 'CANCELLED') return false;
  const dueTime = new Date(isoString).getTime();
  if (!Number.isFinite(dueTime)) return false;
  const diffMs = dueTime - Date.now();
  return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
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

// "5h 30m" style duration for stat cards and history rows — friendlier
// than a clock face when the number isn't actively ticking.
export function formatDuration(totalSeconds = 0) {
  const s = Math.max(Math.floor(totalSeconds), 0);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours === 0 && minutes === 0) return '<1m';
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
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
