import { useState } from 'react';
import { Clock3, History, Pause, Play, Square, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { useTimeEntry } from '../../hooks/useTimeEntry';
import { useTimeEntries, useTimeStats } from '../../hooks/useTimeEntries';
import { formatClock, formatDuration, formatRelativeTime } from '../../utils/formatDate';

// Small "Today / This week" totals strip, fed by the same /stats endpoint
// the full Time Tracking page uses — so the dashboard card doesn't need
// its own aggregation logic to stay in sync with it.
function TotalsStrip({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-line/40" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex flex-col items-center gap-0.5 rounded-lg border border-line bg-paper/60 py-2.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">Today</span>
        <span className="font-display text-lg font-semibold text-ink">{formatDuration(stats?.todaySeconds)}</span>
      </div>
      <div className="flex flex-col items-center gap-0.5 rounded-lg border border-line bg-paper/60 py-2.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">This week</span>
        <span className="font-display text-lg font-semibold text-ink">{formatDuration(stats?.weekSeconds)}</span>
      </div>
    </div>
  );
}

function RecentHistory({ entries, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-9 animate-pulse rounded-lg bg-line/40" />
        ))}
      </div>
    );
  }
  if (!entries.length) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        <History className="h-3 w-3" /> Recent
      </p>
      <ul className="flex flex-col divide-y divide-line">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center gap-2 py-1.5 first:pt-0 last:pb-0">
            <p className="min-w-0 flex-1 truncate text-xs text-ink-soft">{e.label}</p>
            <span className="shrink-0 text-xs font-medium text-ink">{formatDuration(e.elapsedSeconds)}</span>
            <span className="shrink-0 text-[10px] text-ink-muted">{formatRelativeTime(e.stoppedAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TimeTrackingCard({ basePath }) {
  const { entry, loading, elapsedSeconds, start, pause, resume, stop } = useTimeEntry();
  const [label, setLabel] = useState('');
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const { stats, loading: statsLoading } = useTimeStats(reloadKey);
  const { entries: recentEntries, loading: recentLoading, refetch: refetchRecent } = useTimeEntries({ limit: 3 });

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

  async function handleStop() {
    setStopping(true);
    try {
      await stop();
      setReloadKey((k) => k + 1);
      refetchRecent();
    } finally {
      setStopping(false);
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
      <CardBody className="flex flex-col gap-4">
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
              <Button variant="danger" size="md" className="flex-1" loading={stopping} onClick={handleStop}>
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

        <div className="flex items-center gap-1.5 border-t border-line pt-3 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
          <Clock3 className="h-3 w-3" /> Totals
        </div>
        <TotalsStrip stats={stats} loading={statsLoading} />
        <RecentHistory entries={recentEntries} loading={recentLoading} />
      </CardBody>
    </Card>
  );
}
