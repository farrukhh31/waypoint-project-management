import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Route as RouteIcon, GanttChartSquare, Flag, ArrowUpRight } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import TimelineSwitch from '../timeline/TimelineSwitch.jsx';
import ProjectTimelineView from '../timeline/ProjectTimelineView.jsx';
import TaskGanttView from '../timeline/TaskGanttView.jsx';
import MilestonesView from '../timeline/MilestonesView.jsx';

const VIEWS = [
  { key: 'PROJECTS', label: 'Projects', icon: RouteIcon },
  { key: 'TASKS', label: 'Tasks', icon: GanttChartSquare },
  { key: 'MILESTONES', label: 'Milestones', icon: Flag },
];

// Dashboard-sized preview of the full /admin/timeline page — same three
// views, same switch, just capped to a handful of rows with a link out
// to the full page for anything more involved (zoom, drag-reschedule).
export default function TimelineWidget({ projects = [], tasks = [], fullPath = '/admin/timeline' }) {
  const [view, setView] = useState('PROJECTS');

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-wrap gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Timeline</h3>
          <p className="text-xs text-ink-muted">Projects, tasks, and milestones at a glance</p>
        </div>
        <TimelineSwitch views={VIEWS} active={view} onChange={setView} />
      </CardHeader>
      <CardBody className="flex flex-1 flex-col">
        {view === 'PROJECTS' && (
          <ProjectTimelineView projects={projects} basePath="/admin/projects" compact className="flex-1" />
        )}
        {view === 'TASKS' && (
          <TaskGanttView tasks={tasks.slice(0, 8)} zoom="MONTH" basePath="/admin/tasks" onReschedule={async () => {}} />
        )}
        {view === 'MILESTONES' && (
          <MilestonesView tasks={tasks.slice(0, 6)} projects={projects.slice(0, 4)} basePath="/admin/tasks" />
        )}
        <Link
          to={fullPath}
          className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-xs font-medium text-route-600 transition-colors hover:bg-paper hover:shadow-card"
        >
          View full timeline
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardBody>
    </Card>
  );
}
