// Shared date-math for every Timeline view (Project / Gantt / Milestones).
// Kept framework-free so it's easy to unit test and reuse across views.

export const DAY = 86400000;

export const ZOOM_LEVELS = {
  WEEK: { label: 'Week', pxPerDay: 46, tickUnit: 'day' },
  MONTH: { label: 'Month', pxPerDay: 14, tickUnit: 'week' },
  QUARTER: { label: 'Quarter', pxPerDay: 5, tickUnit: 'month' },
};

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * DAY);
}

export function diffDays(a, b) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY);
}

// Widest usable start/due pair for an item — tasks without a startDate
// get a synthetic 3-day bar ending on their due date, so they still read
// as a bar rather than vanishing from the chart.
export function effectiveRange(item) {
  const due = item.dueDate ? new Date(item.dueDate) : null;
  const start = item.startDate ? new Date(item.startDate) : due ? addDays(due, -3) : null;
  return { start, end: due || start };
}

// Computes a padded [rangeStart, rangeEnd] window covering every item,
// plus where "today" falls as a day offset (or null if out of range).
export function computeWindow(items) {
  const ranges = items.map(effectiveRange).filter((r) => r.start && r.end);
  if (ranges.length === 0) {
    const now = startOfDay(new Date());
    return { rangeStart: addDays(now, -7), rangeEnd: addDays(now, 21) };
  }
  const starts = ranges.map((r) => r.start.getTime());
  const ends = ranges.map((r) => r.end.getTime());
  const rawStart = startOfDay(new Date(Math.min(...starts)));
  const rawEnd = startOfDay(new Date(Math.max(...ends)));
  const pad = Math.max(Math.round(diffDays(rawEnd, rawStart) * 0.08), 3);
  return { rangeStart: addDays(rawStart, -pad), rangeEnd: addDays(rawEnd, pad) };
}

export function formatShort(date) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatMonthYear(date) {
  return new Date(date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
