import { useState } from 'react';
import { Route as RouteIcon, GanttChartSquare, Flag, Users } from 'lucide-react';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import TimelineSwitch from '../../components/timeline/TimelineSwitch.jsx';
import TimelineZoom from '../../components/timeline/TimelineZoom.jsx';
import ProjectTimelineView from '../../components/timeline/ProjectTimelineView.jsx';
import TaskGanttView from '../../components/timeline/TaskGanttView.jsx';
import MilestonesView from '../../components/timeline/MilestonesView.jsx';
import WorkloadView from '../../components/timeline/WorkloadView.jsx';
import { useTimeline } from '../../hooks/useTimeline';

const ALL_VIEWS = [
  {
    key: 'PROJECTS',
    label: 'Project timeline',
    icon: RouteIcon,
    blurb: 'Every project as a journey on one shared road.',
    accent: 'route',
  },
  {
    key: 'TASKS',
    label: 'Task Gantt',
    icon: GanttChartSquare,
    blurb: 'Every task, scheduled and reschedulable, on one bar chart.',
    accent: 'accent',
  },
  {
    key: 'CAPACITY',
    label: 'Capacity',
    icon: Users,
    blurb: "Who's stretched thin, and exactly when.",
    accent: 'teal',
  },
  {
    key: 'MILESTONES',
    label: 'Milestones',
    icon: Flag,
    blurb: 'What ships next, grouped by when it lands.',
    accent: 'danger',
  },
];

// Capacity and Milestones are manager-facing: Capacity ranks every
// assignee's workload against everyone else's, and Milestones rolls up
// what's shipping across all of a manager's projects — neither is
// something a Team Member owns or needs to see about themselves. A Team
// Member's timeline (`readOnly`) sticks to just their own Project
// timeline and Task Gantt.
const TEAM_VIEWS = ALL_VIEWS.filter((v) => v.key === 'PROJECTS' || v.key === 'TASKS');

const ACCENT_CHIP = {
  route: 'bg-gradient-to-br from-route-500 to-route-600 shadow-route-500/30',
  accent: 'bg-gradient-to-br from-accent-400 to-accent-500 shadow-accent-400/30',
  teal: 'bg-gradient-to-br from-teal-400 to-teal-500 shadow-teal-400/30',
  danger: 'bg-gradient-to-br from-danger-400 to-danger-500 shadow-danger-400/30',
};
const ACCENT_GLOW = {
  route: 'bg-route-400/15',
  accent: 'bg-accent-400/15',
  teal: 'bg-teal-400/15',
  danger: 'bg-danger-400/15',
};

// basePath/description let this same page serve Admin ("Every project and
// task...") and PM ("Your projects and tasks...") — and now also Team
// Member ("Your projects and tasks...", read-only). PM's and Team's
// underlying /projects and /tasks/timeline data is already scoped to what
// they're allowed to see by the backend, so only the link targets, copy,
// and (for Team) the reschedule permission need to change here — a Team
// Member can view the Gantt but the backend's /tasks/:id/reschedule route
// is Admin/PM only, so `readOnly` disables dragging rather than letting
// someone start a drag that 403s or silently reverts.
//
// Premium pass: the header now carries the same ambient-glow + card-sheen
// language as WelcomeBanner, with its icon chip and glow tinting to match
// whichever view is active — so Capacity, say, reads as its own teal-tinted
// place rather than a generic tab — plus a live pulse badge for consistency
// with Reports. Keying the body's Reveal on `view` re-triggers the
// scroll-in animation on every tab switch, so changing tabs feels like the
// new view "arriving" instead of a flat content swap.
export default function Timeline({
  basePath = '/admin',
  description = 'Every project and task, laid out on one shared road.',
  readOnly = false,
}) {
  const VIEWS = readOnly ? TEAM_VIEWS : ALL_VIEWS;
  const [view, setView] = useState('PROJECTS');
  const [zoom, setZoom] = useState('MONTH');
  const { projects, tasks, loading, rescheduleTask } = useTimeline();

  if (loading) return <FullScreenLoader />;

  const active = VIEWS.find((v) => v.key === view);
  const projectsBasePath = `${basePath}/projects`;
  const tasksBasePath = `${basePath}/tasks`;

  return (
    <div className="flex flex-col gap-6">
      <Card className="card-sheen relative overflow-hidden p-5">
        <span
          key={active.accent}
          className={`animate-glow-pulse pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full blur-3xl transition-colors duration-500 ${ACCENT_GLOW[active.accent]}`}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span
              key={`chip-${active.accent}`}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-colors duration-300 animate-word-in ${ACCENT_CHIP[active.accent]}`}
            >
              <active.icon className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-semibold text-ink">Timeline</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-success-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success-500" />
                  </span>
                  Live
                </span>
              </div>
              <p className="text-sm text-ink-muted">
                {view === 'PROJECTS' ? description : active.blurb}{' '}
                <span className="text-ink-muted/70">
                  · {projects.length} projects, {tasks.length} tasks
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {(view === 'TASKS' || view === 'CAPACITY') && <TimelineZoom zoom={zoom} onChange={setZoom} />}
            <TimelineSwitch views={VIEWS} active={view} onChange={setView} />
          </div>
        </div>
      </Card>

      <Reveal key={view} delay={40}>
        <Card className="overflow-hidden">
          <CardBody>
            {view === 'PROJECTS' && <ProjectTimelineView projects={projects} basePath={projectsBasePath} />}
            {view === 'TASKS' && (
              <TaskGanttView
                tasks={tasks}
                zoom={zoom}
                basePath={tasksBasePath}
                onReschedule={readOnly ? undefined : rescheduleTask}
                readOnly={readOnly}
              />
            )}
            {view === 'CAPACITY' && <WorkloadView tasks={tasks} zoom={zoom} />}
            {view === 'MILESTONES' && (
              <MilestonesView tasks={tasks} projects={projects} basePath={tasksBasePath} projectsBasePath={projectsBasePath} />
            )}
          </CardBody>
        </Card>
      </Reveal>
    </div>
  );
}
