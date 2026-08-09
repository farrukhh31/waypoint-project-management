import { useId, useMemo, useState } from 'react';
import { Eye, EyeOff, Lock, Check, X as XIcon } from 'lucide-react';
import clsx from 'clsx';

// Blocks copy / cut / paste / drag-drop / context-menu on a password field.
// This is a UX nudge (discourage password reuse / pasting leaked creds from
// clipboard managers into the wrong field) — it is NOT a security boundary,
// since it's trivially bypassed via devtools. Backend validation is what
// actually enforces password rules.
function blockClipboard(e) {
  e.preventDefault();
  return false;
}

function scorePassword(pw) {
  if (!pw) return { score: 0, checks: {} };
  const checks = {
    length: pw.length >= 8,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    digit: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { score: passed, checks };
}

const STRENGTH_META = [
  { label: 'Too weak', color: 'bg-danger-400', text: 'text-danger-600' },
  { label: 'Too weak', color: 'bg-danger-400', text: 'text-danger-600' },
  { label: 'Weak', color: 'bg-accent-400', text: 'text-accent-600' },
  { label: 'Okay', color: 'bg-accent-400', text: 'text-accent-600' },
  { label: 'Strong', color: 'bg-success-400', text: 'text-success-600' },
  { label: 'Excellent', color: 'bg-success-400', text: 'text-success-600' },
];

/**
 * Premium password field: no copy/cut/paste/context-menu, a show/hide
 * toggle, and an optional live strength meter (pass `showStrength`).
 */
export default function PasswordInput({
  className,
  error,
  showStrength = false,
  autoComplete = 'current-password',
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();
  const { score, checks } = useMemo(() => scorePassword(props.value), [props.value]);
  const meta = STRENGTH_META[Math.min(score, STRENGTH_META.length - 1)];

  return (
    <div>
      <div className="group relative">
        <Lock
          className={clsx(
            'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
            error ? 'text-danger-400' : 'text-ink-muted group-focus-within:text-route-500'
          )}
        />
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          onCopy={blockClipboard}
          onCut={blockClipboard}
          onPaste={blockClipboard}
          onDragStart={blockClipboard}
          onDrop={blockClipboard}
          onContextMenu={blockClipboard}
          className={clsx(
            'h-11 w-full rounded-lg border bg-surface pl-9 pr-11 text-base text-ink placeholder:text-ink-muted sm:text-sm',
            'transition-shadow duration-150',
            'focus:border-route-500 focus:outline-none focus:ring-4 focus:ring-route-500/10',
            error ? 'border-danger-400' : 'border-line',
            className
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink-soft focus-visible:outline-route-500"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && props.value && (
        <div className="mt-2.5">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={clsx(
                  'h-1 flex-1 rounded-full transition-colors duration-200',
                  i < score ? meta.color : 'bg-line'
                )}
              />
            ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <p className={clsx('text-xs font-medium', meta.text)}>{meta.label}</p>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            <StrengthRule ok={checks.length} label="8+ characters" />
            <StrengthRule ok={checks.upper} label="Uppercase letter" />
            <StrengthRule ok={checks.lower} label="Lowercase letter" />
            <StrengthRule ok={checks.digit} label="A number" />
          </ul>
        </div>
      )}
    </div>
  );
}

function StrengthRule({ ok, label }) {
  return (
    <li className={clsx('flex items-center gap-1.5 text-xs', ok ? 'text-success-600' : 'text-ink-muted')}>
      {ok ? <Check className="h-3 w-3 shrink-0" /> : <XIcon className="h-3 w-3 shrink-0" />}
      {label}
    </li>
  );
}
