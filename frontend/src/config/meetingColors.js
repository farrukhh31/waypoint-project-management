// Small, curated set of accent hues a meeting can be tagged with — mirrors
// the app's existing design tokens (route/accent/success/danger/sky/teal)
// so a meeting's color always matches the rest of the UI instead of an
// arbitrary hex picker.
export const MEETING_COLORS = {
  route: { label: 'Indigo', dot: 'bg-route-500', chip: 'bg-route-500 text-white', ring: 'ring-route-400', wash: 'from-route-500/10' },
  accent: { label: 'Orange', dot: 'bg-accent-400', chip: 'bg-accent-400 text-white', ring: 'ring-accent-400', wash: 'from-accent-400/10' },
  success: { label: 'Green', dot: 'bg-success-400', chip: 'bg-success-400 text-white', ring: 'ring-success-400', wash: 'from-success-400/10' },
  danger: { label: 'Red', dot: 'bg-danger-400', chip: 'bg-danger-400 text-white', ring: 'ring-danger-400', wash: 'from-danger-400/10' },
  sky: { label: 'Sky', dot: 'bg-sky-400', chip: 'bg-sky-400 text-white', ring: 'ring-sky-400', wash: 'from-sky-400/10' },
  teal: { label: 'Teal', dot: 'bg-teal-400', chip: 'bg-teal-400 text-white', ring: 'ring-teal-400', wash: 'from-teal-400/10' },
};

export const DEFAULT_MEETING_COLOR = 'route';

export function meetingColor(key) {
  return MEETING_COLORS[key] || MEETING_COLORS[DEFAULT_MEETING_COLOR];
}
