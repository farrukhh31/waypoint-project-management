// Minimal pub-sub so anything doing async work can report it without
// wiring React context through every call site. api.js is the only
// publisher today (every request increments, every settle decrements);
// TopProgressBar is the only subscriber.
const listeners = new Set();
let count = 0;

export function startLoading() {
  count += 1;
  listeners.forEach((fn) => fn(count));
}

export function stopLoading() {
  count = Math.max(0, count - 1);
  listeners.forEach((fn) => fn(count));
}

export function subscribeLoading(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
