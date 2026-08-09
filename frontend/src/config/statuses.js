// Mirrors the ENUMs on Task and Project models in the backend.

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];

export const TASK_STATUS_META = {
  TODO: { label: 'To Do', className: 'bg-ink-muted/10 text-ink-soft' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-route-100 text-route-700' },
  REVIEW: { label: 'Review', className: 'bg-accent-100 text-accent-700' },
  COMPLETED: { label: 'Completed', className: 'bg-success-50 text-success-600' },
};

export const PROJECT_STATUSES = ['PLANNED', 'ACTIVE', 'ON_HOLD', 'PENDING_APPROVAL', 'COMPLETED', 'CANCELLED'];

export const PROJECT_STATUS_META = {
  PLANNED: { label: 'Planned', className: 'bg-ink-muted/10 text-ink-soft' },
  ACTIVE: { label: 'Active', className: 'bg-route-100 text-route-700' },
  ON_HOLD: { label: 'On Hold', className: 'bg-accent-100 text-accent-700' },
  PENDING_APPROVAL: { label: 'Pending Approval', className: 'bg-sky-100 text-sky-700' },
  COMPLETED: { label: 'Completed', className: 'bg-success-50 text-success-600' },
  CANCELLED: { label: 'Cancelled', className: 'bg-danger-50 text-danger-600' },
};

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const PRIORITY_META = {
  LOW: { label: 'Low', className: 'bg-ink-muted/10 text-ink-soft' },
  MEDIUM: { label: 'Medium', className: 'bg-route-100 text-route-700' },
  HIGH: { label: 'High', className: 'bg-accent-100 text-accent-700' },
  URGENT: { label: 'Urgent', className: 'bg-danger-50 text-danger-600' },
};

// Shared per-status "tone" used anywhere a project status needs to drive
// color beyond the pill badge — card accent bars, timeline pins, gradient
// washes, chart fills. Keeping this one place means the card, the list row,
// the filter pills, and the details page all agree on what "Active" looks
// like.
export const PROJECT_STATUS_TONE = {
  PLANNED: { bar: 'bg-ink-muted', solid: '#75778F', wash: 'from-ink-muted/5', ring: 'text-ink-muted' },
  ACTIVE: { bar: 'bg-route-500', solid: '#5B4FE0', wash: 'from-route-50', ring: 'text-route-500' },
  ON_HOLD: { bar: 'bg-accent-400', solid: '#FF8C1A', wash: 'from-accent-50', ring: 'text-accent-400' },
  PENDING_APPROVAL: { bar: 'bg-sky-400', solid: '#12AEDE', wash: 'from-sky-50', ring: 'text-sky-400' },
  COMPLETED: { bar: 'bg-success-400', solid: '#17B26A', wash: 'from-success-50', ring: 'text-success-400' },
  CANCELLED: { bar: 'bg-danger-400', solid: '#F0324B', wash: 'from-danger-50', ring: 'text-danger-400' },
};
