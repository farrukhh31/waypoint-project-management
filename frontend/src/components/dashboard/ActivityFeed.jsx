import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import ActivityPillChart from './ActivityPillChart.jsx';

// `h-full` + a flex-centered body so this matches the height of whatever
// it's sitting next to (usually the taller, scrolling OrgActivityFeed) —
// without it, the grid cell stretches but this card's own box stays only
// as tall as its (short) pill chart, leaving a dead gap underneath it.
export default function ActivityFeed({ activityByDay = [] }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-pop">
      <CardHeader className="bg-gradient-to-r from-route-400/10 via-surface to-surface">
        <h3 className="font-display text-base font-semibold text-ink">Recent activity</h3>
        <span className="text-xs text-ink-muted">Last 7 days</span>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col justify-center gap-5">
        {activityByDay.length > 0 ? (
          <div className="rounded-lg border border-line bg-paper/40 p-4">
            <ActivityPillChart days={activityByDay} />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-route-400" /> Project activity
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent-400" /> Task activity
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success-400" /> Team activity
              </span>
            </div>
          </div>
        ) : (
          <EmptyState title="Quiet so far" description="Project and task activity will show up here." />
        )}
      </CardBody>
    </Card>
  );
}