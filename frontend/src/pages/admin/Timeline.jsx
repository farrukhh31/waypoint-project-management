import { useState } from 'react';
import { Route as RouteIcon, GanttChartSquare, Flag } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/ui/Card.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';
import TimelineSwitch from '../../components/timeline/TimelineSwitch.jsx';
import TimelineZoom from '../../components/timeline/TimelineZoom.jsx';
import ProjectTimelineView from '../../components/timeline/ProjectTimelineView.jsx';
import TaskGanttView from '../../components/timeline/TaskGanttView.jsx';
import MilestonesView from '../../components/timeline/MilestonesView.jsx';
import { useTimeline } from '../../hooks/useTimeline';

const VIEWS = [
  { key: 'PROJECTS', label: 'Project timeline', icon: RouteIcon },
  { key: 'TASKS', label: 'Task Gantt', icon: GanttChartSquare },
  { key: 'MILESTONES', label: 'Milestones', icon: Flag },
];

export default function Timeline() {
  const [view, setView] = useState('PROJECTS');
  const [zoom, setZoom] = useState('MONTH');
  const { projects, tasks, loading, rescheduleTask } = useTimeline();

  if (loading) return <FullScreenLoader />;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-wrap gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">Timeline</h3>
            <p className="text-xs text-ink-muted">Every project and task, laid out on one shared road.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {view !== 'PROJECTS' && <TimelineZoom zoom={zoom} onChange={setZoom} />}
            <TimelineSwitch views={VIEWS} active={view} onChange={setView} />
          </div>
        </CardHeader>
        <CardBody>
          {view === 'PROJECTS' && <ProjectTimelineView projects={projects} basePath="/admin/projects" />}
          {view === 'TASKS' && (
            <TaskGanttView tasks={tasks} zoom={zoom} basePath="/admin/tasks" onReschedule={rescheduleTask} />
          )}
          {view === 'MILESTONES' && <MilestonesView tasks={tasks} projects={projects} basePath="/admin/tasks" />}
        </CardBody>
      </Card>
    </div>
  );
}
