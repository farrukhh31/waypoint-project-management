import { useState } from 'react';
import { Pause, Play, Square, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { useTimeEntry } from '../../hooks/useTimeEntry';
import { formatClock } from '../../utils/formatDate';

export default function TimeTrackingCard({ basePath }) {
  const { entry, loading, elapsedSeconds, start, pause, resume, stop } = useTimeEntry();
  const [label, setLabel] = useState('');
  const [starting, setStarting] = useState(false);

  async function handleStart(e) {
    e.preventDefault();
    if (!label.trim()) return;
    setStarting(true);
    try {
      await start(label.trim());
      setLabel('');
    } finally {
      setStarting(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <h3 className="font-display text-base font-semibold text-ink">Time tracking</h3>
        {basePath ? (
          <Link to={`${basePath}/time-tracking`} className="text-xs font-medium text-route-600 hover:underline">
            View all
          </Link>
        ) : (
          <Timer className="h-4 w-4 text-ink-muted" />
        )}
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="h-24 animate-pulse rounded-lg bg-line/40" />
        ) : entry ? (
          <div className="flex flex-col items-center gap-4 py-1 text-center">
            <p className="max-w-full truncate text-sm font-medium text-ink-soft">{entry.label}</p>
            <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-ink">
              {formatClock(elapsedSeconds)}
            </p>
            {entry.status === 'PAUSED' && (
              <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-600">
                Paused
              </span>
            )}
            <div className="flex w-full gap-2">
              {entry.status === 'RUNNING' ? (
                <Button variant="secondary" size="md" className="flex-1" onClick={pause}>
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              ) : (
                <Button variant="secondary" size="md" className="flex-1" onClick={resume}>
                  <Play className="h-4 w-4" /> Resume
                </Button>
              )}
              <Button variant="danger" size="md" className="flex-1" onClick={stop}>
                <Square className="h-3.5 w-3.5" /> Stop
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStart} className="flex flex-col gap-3 py-2">
            <p className="text-center text-sm text-ink-muted">Nothing being tracked right now.</p>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="What are you working on?"
            />
            <Button type="submit" size="md" loading={starting} disabled={!label.trim()}>
              <Play className="h-4 w-4" /> Start timer
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
