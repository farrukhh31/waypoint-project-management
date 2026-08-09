import { CheckCircle2, AlertCircle } from 'lucide-react';

// { type: 'success' | 'error', text: string } — a small self-dismissing-style
// banner used under forms to report the result of a save action.
export default function InlineMessage({ message }) {
  if (!message) return null;
  const isError = message.type === 'error';
  return (
    <div
      className={
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm animate-[fade-in-up_0.15s_ease-out] ' +
        (isError ? 'bg-danger-50 text-danger-600' : 'bg-success-50 text-success-600')
      }
    >
      {isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
      {message.text}
    </div>
  );
}
