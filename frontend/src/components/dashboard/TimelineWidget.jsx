import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Route as RouteIcon, GanttChartSquare, Flag, ArrowUpRight, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import clsx from 'clsx';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import TimelineSwitch from '../timeline/TimelineSwitch.jsx';
import ProjectTimelineView from '../timeline/ProjectTimelineView.jsx';
import TaskGanttView from '../timeline/TaskGanttView.jsx';
import MilestonesView from '../timeline/MilestonesView.jsx';
import ProjectSpotlight, { pickSpotlightProject } from './ProjectSpotlight.jsx';
import OnDeckTasks, { pickOnDeckTasks } from './OnDeckTasks.jsx';
import TeamLoadStrip from './TeamLoadStrip.jsx';
import { startOfDay } from '../../utils/timelineScale';

const ALL_VIEWS = [
  { key: 'PROJECTS', label: 'Projects', icon: RouteIcon },
  { key: 'TASKS', label: 'Tasks', icon: GanttChartSquare },
  { key: 'MILESTONES', label: 'Milestones', icon: Flag },
];

// Dashboard-sized preview of the full /admin/timeline page — same
// views, same switch, just capped to a handful of rows with a link out
// to the full page for anything more involved (zoom, drag-reschedule).
//
// `simplified` drops the Milestones tab. Milestones are a
// project-management concern (what ships next, across projects a person
// manages) — not something a Team Member needs on their own daily-driver
// preview, so their dashboard only offers Projects and Tasks.
export default function TimelineWidget({
  projects = [],
  tasks = [],
  fullPath = '/admin/timeline',
  fullLabel = 'View full timeline',
  projectsBasePath = '/admin/projects',
  tasksBasePath = '/admin/tasks',
  simplified = false,
}) {
  const VIEWS = simplified ? ALL_VIEWS.filter((v) => v.key !== 'MILESTONES') : ALL_VIEWS;
  const [view, setView] = useState('PROJECTS');

  // Quick-glance pulse for the three numbers a PM actually checks first —
  // sits between the scrollable view and the "full timeline" link, so the
  // widget uses whatever height the neighboring column gives it instead of
  // leaving dead space below a fixed-height scroll area.
  const pulse = useMemo(() => {
    const today = startOfDay(new Date());
    let onTrack = 0;
    let dueSoon = 0;
    let overdue = 0;
    for (const t of tasks) {
      if (t.status === 'COMPLETED' || !t.dueDate) continue;
      const due = startOfDay(new Date(t.dueDate));
      const days = Math.round((due - today) / 86400000);
      if (days < 0) overdue += 1;
      else if (days <= 3) dueSoon += 1;
      else onTrack += 1;
    }
    return { onTrack, dueSoon, overdue };
  }, [tasks]);

  const spotlightProject = useMemo(() => pickSpotlightProject(projects), [projects]);
  const onDeckTasks = useMemo(() => pickOnDeckTasks(tasks), [tasks]);

  const PULSE_ITEMS = [
    { key: 'onTrack', label: 'On track', value: pulse.onTrack, icon: CheckCircle2, tone: 'text-success-600', dot: 'bg-success-400' },
    { key: 'dueSoon', label: 'Due soon', value: pulse.dueSoon, icon: Clock, tone: 'text-accent-600', dot: 'bg-accent-400' },
    { key: 'overdue', label: 'Overdue', value: pulse.overdue, icon: AlertTriangle, tone: 'text-danger-600', dot: 'bg-danger-400' },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-wrap gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Timeline</h3>
          <p className="text-xs text-ink-muted">Projects, tasks, and milestones at a glance</p>
        </div>
        <TimelineSwitch views={VIEWS} active={view} onChange={setView} />
      </CardHeader>
      <CardBody className="flex flex-1 flex-col gap-4">
        {/* Spotlight gives the widget one real, meaningfully-sized story
            (the project needing attention soonest) instead of leaning on
            justify-center to paper over a short list with empty space. */}
        {spotlightProject && <ProjectSpotlight project={spotlightProject} basePath={projectsBasePath} />}
        <OnDeckTasks tasks={onDeckTasks} basePath={tasksBasePath} />

        <div className="min-h-[160px] flex-1 overflow-y-auto pr-1">
          {view === 'PROJECTS' && (
            <ProjectTimelineView projects={projects} basePath={projectsBasePath} compact className="flex-1" />
          )}
          {view === 'TASKS' && (
            <TaskGanttView tasks={tasks.slice(0, 8)} zoom="MONTH" basePath={tasksBasePath} onReschedule={async () => {}} />
          )}
          {view === 'MILESTONES' && (
            <MilestonesView
              tasks={tasks.slice(0, 6)}
              projects={projects.slice(0, 4)}
              basePath={tasksBasePath}
              projectsBasePath={projectsBasePath}
              compact
            />
          )}
        </div>

        {/* Pulse strip — real counts from the same task list, not filler. */}
        <div className="grid grid-cols-3 gap-2">
          {PULSE_ITEMS.map((item, i) => (
            <div
              key={item.key}
              className="animate-[fade-in-up_0.35s_ease-out_both] rounded-lg border border-line bg-paper/60 px-3 py-2 transition-colors duration-200 hover:bg-paper"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-1.5">
                <span className={clsx('h-1.5 w-1.5 rounded-full', item.dot)} />
                <item.icon className={clsx('h-3.5 w-3.5', item.tone)} />
              </div>
              <p className={clsx('mt-1 font-display text-lg font-semibold', item.tone)}>{item.value}</p>
              <p className="text-[11px] text-ink-muted">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Team load — who's actually carrying the open work, giving the
            bottom of the card a real close instead of the pulse grid
            dropping straight into the thin footer link. */}
        <TeamLoadStrip tasks={tasks} />

        <Link
          to={fullPath}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-xs font-medium text-route-600 transition-colors hover:bg-paper hover:shadow-card"
        >
          {fullLabel}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardBody>
    </Card>
  );
}