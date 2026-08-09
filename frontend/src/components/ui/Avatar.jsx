import { useState } from 'react';
import clsx from 'clsx';

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const SIZES = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

// Each person gets a consistent hue from a stable hash of their name,
// so avatars read as distinct people across the app at a glance instead
// of one flat brand-blue chip everywhere.
const HUES = [
  'bg-route-100 text-route-700',
  'bg-accent-100 text-accent-700',
  'bg-teal-100 text-teal-700',
  'bg-sky-100 text-sky-700',
  'bg-success-100 text-success-700',
  'bg-danger-100 text-danger-700',
];

function hueFor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return HUES[hash % HUES.length];
}

export default function Avatar({ name, size = 'md', src, className }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(src) && !imgFailed;

  if (showImage) {
    return (
      <img
        src={src}
        alt={name}
        title={name}
        onError={() => setImgFailed(true)}
        className={clsx('shrink-0 rounded-full object-cover', SIZES[size], className)}
      />
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-display font-medium',
        hueFor(name),
        SIZES[size],
        className
      )}
      title={name}
    >
      {initials(name) || '?'}
    </span>
  );
}
