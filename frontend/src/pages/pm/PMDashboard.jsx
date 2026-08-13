import { useMemo } from 'react';
import { FolderKanban, Activity, ListChecks, Eye, CheckCircle2, ClipboardCheck, Users2, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import { useTimeline } from '../../hooks/useTimeline';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/ui/StatCard.jsx';
import Card from '../../components/ui/Card.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';
import WelcomeBanner from '../../components/dashboard/WelcomeBanner.jsx';
import CompletionRing from '../../components/dashboard/CompletionRing.jsx';
import StatusOverviewCard from '../../components/dashboard/StatusOverviewCard.jsx';
import TimelineWidget from '../../components/dashboard/TimelineWidget.jsx';
import SectionHeading from '../../components/dashboard/SectionHeading.jsx';
import StatusBreakdown from '../../components/dashboard/StatusBreakdown.jsx';
import PriorityBreakdown from '../../components/dashboard/PriorityBreakdown.jsx';
import TeamPerformance from '../../components/dashboard/TeamPerformance.jsx';
import DeadlinesPanel from '../../components/dashboard/DeadlinesPanel.jsx';
import DeadlineCounter from '../../components/dashboard/DeadlineCounter.jsx';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline.jsx';
import ProjectRoute from '../../components/dashboard/ProjectRoute.jsx';
import TimeTrackingCard from '../../components/dashboard/TimeTrackingCard.jsx';
import MeetingsCard from '../../components/dashboard/MeetingsCard.jsx';
import HealthSnapshot from '../../components/dashboard/HealthSnapshot.jsx';
import AtRiskProjects from '../../components/dashboard/AtRiskProjects.jsx';
import { PROJECT_STATUSES, PROJECT_STATUS_META, PROJECT_STATUS_TONE, TASK_STATUSES, TASK_STATUS_META, TASK_STATUS_TONE } from '../../config/statuses';

// The PM's daily-driver view — same sectioned language as AdminDashboard
// (Pulse / Today / Needs attention / Team / Breakdown / Activity) so the
// two portals read as one consistent product, but every number, list, and
// link here is scoped to projects this PM actually manages: no org-wide
// user counts, no cross-project activity, nothing an Admin sees that a
// PM has no reason to. A couple of stats (team size, urgent load) are
// derived client-side from the same project/task lists the timeline
// widget already loaded, rather than round-tripping for numbers the
// dashboard endpoint doesn't need to own.
export default function PMDashboard() {
  const { user } = useAuth();
  const { data, loading } = useDashboard();
  const { projects, tasks, loading: timelineLoading } = useTimeline();

  const teamSize = useMemo(() => {
    const ids = new Set();
    projects.forEach((p) => (p.members || []).forEach((m) => ids.add(m.id)));
    return ids.size;
  }, [projects]);

  const urgentOpenTasks = useMemo(
    () => tasks.filter((t) => t.priority === 'URGENT' && t.status !== 'COMPLETED').length,
    [tasks]
  );

  if (loading) return <FullScreenLoader />;

  const stats = data?.stats ?? {};

  return (
    <div className="flex flex-col gap-8">
      <Reveal>
        <WelcomeBanner
          name={user?.name}
          highlights={[
            { label: 'active projects', value: stats.activeProjects ?? 0, icon: Activity, to: '/pm/projects?status=ACTIVE', tone: 'bg-route-100 text-route-600' },
            { label: 'need your review', value: stats.tasksAwaitingReview ?? 0, icon: Eye, to: '/pm/tasks?status=REVIEW', tone: 'bg-sky-100 text-sky-700' },
            { label: 'urgent tasks', value: timelineLoading ? '—' : urgentOpenTasks, icon: AlertOctagon, to: '/pm/tasks', tone: 'bg-danger-50 text-danger-600' },
          ]}
        />
      </Reveal>

      {!timelineLoading && (
        <Reveal delay={20}>
          <DeadlineCounter tasks={tasks} projects={projects} tasksPath="/pm/tasks" />
        </Reveal>
      )}

      {/* Pulse — the headline numbers for this PM's own portfolio */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading
            eyebrow="Pulse"
            title="Your portfolio, right now"
            description="Every project you manage, at a glance."
            action={
              <Link
                to="/pm/reports/team"
                className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-route-200 hover:text-route-600 hover:shadow-card"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                Member reports
              </Link>
            }
          />
        </Reveal>
        <Reveal delay={50} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatusOverviewCard
            label="Your projects"
            icon={FolderKanban}
            accent="route"
            total={stats.assignedProjects}
            data={data?.projectsByStatus}
            meta={PROJECT_STATUS_META}
            tone={PROJECT_STATUS_TONE}
            order={PROJECT_STATUSES}
            to="/pm/projects"
          />
          <StatusOverviewCard
            label="Total tasks"
            icon={ListChecks}
            accent="accent"
            total={stats.totalTasks}
            data={data?.tasksByStatus}
            meta={TASK_STATUS_META}
            tone={TASK_STATUS_TONE}
            order={TASK_STATUSES}
            to="/pm/tasks"
          />
        </Reveal>
        <Reveal delay={60} className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Active projects" value={stats.activeProjects} icon={Activity} accent="accent" tilt to="/pm/projects?status=ACTIVE" />
          <StatCard
            label="Needs your review"
            value={stats.tasksAwaitingReview}
            icon={Eye}
            accent="sky"
            tilt
            hint={stats.tasksAwaitingReview > 0 ? 'Submitted and waiting on you' : "You're all caught up"}
            to="/pm/tasks?status=REVIEW"
          />
          <StatCard label="Completed tasks" value={stats.completedTasks} icon={CheckCircle2} accent="success" tilt />
          <StatCard
            label="Urgent tasks"
            value={timelineLoading ? undefined : urgentOpenTasks}
            icon={AlertOctagon}
            accent="danger"
            tilt
            hint={urgentOpenTasks > 0 ? 'Open and marked urgent' : 'Nothing urgent open'}
            to="/pm/tasks"
          />
          <StatCard
            label="Team members"
            value={timelineLoading ? undefined : teamSize}
            icon={Users2}
            accent="teal"
            tilt
            hint="Across your projects"
            to="/pm/reports/team"
          />
          <CompletionRing completed={stats.completedTasks} total={stats.totalTasks} to="/pm/tasks" />
        </Reveal>
      </div>

      {/* Today — this PM's own active projects, tasks and schedule */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Today" title="Roadmap &amp; schedule" description="Where your projects stand, and what's coming up next." />
        </Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Reveal delay={80} className="lg:col-span-2">
            {timelineLoading ? (
              <Card className="flex h-64 items-center justify-center text-sm text-ink-muted">Loading timeline…</Card>
            ) : (
              <TimelineWidget
                projects={projects}
                tasks={tasks}
                fullPath="/pm/timeline"
                fullLabel="View full timeline"
                projectsBasePath="/pm/projects"
                tasksBasePath="/pm/tasks"
              />
            )}
          </Reveal>
          <Reveal delay={120} className="flex flex-col gap-4">
            <TimeTrackingCard basePath="/pm" />
            <MeetingsCard basePath="/pm" />
          </Reveal>
        </div>
      </div>

      {/* Needs attention — on hold, awaiting admin approval, and overdue,
          scoped to just this PM's own projects. */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Needs attention" title="Risk, at a glance" description="On hold, awaiting approval, overdue, and the projects behind it." />
        </Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reveal delay={80}>
            <HealthSnapshot
              onHold={stats.onHoldProjects}
              pendingApproval={stats.pendingApprovalProjects}
              overdue={stats.overdueTasks}
              basePath="/pm/projects"
            />
          </Reveal>
          <Reveal delay={120}>
            {timelineLoading ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-line bg-surface text-sm text-ink-muted">
                Scanning projects…
              </div>
            ) : (
              <AtRiskProjects projects={projects} basePath="/pm/projects" />
            )}
          </Reveal>
        </div>
      </div>

      {/* Team — priority mix across your projects, and who's actually
          closing tasks out. New vs. the old stub: gives a PM the same
          "who's carrying the load" read Admin gets on Reports, just
          scoped to their own roster. */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Team" title="Priorities &amp; contributors" description="What's urgent, and who's moving the work." />
        </Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reveal delay={80} className="h-full">
            {timelineLoading ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-line bg-surface text-sm text-ink-muted">
                Crunching priorities…
              </div>
            ) : (
              <PriorityBreakdown projects={projects} tasks={tasks} />
            )}
          </Reveal>
          <Reveal delay={120} className="h-full">
            {timelineLoading ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-line bg-surface text-sm text-ink-muted">
                Ranking contributors…
              </div>
            ) : (
              <TeamPerformance tasks={tasks} workloadPath="/pm/timeline" />
            )}
          </Reveal>
        </div>
      </div>

      {/* Breakdown — composition + deadlines, this PM's projects only */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Breakdown" title="Status &amp; deadlines" description="Where your projects and tasks currently sit." />
        </Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Reveal delay={80} className="flex flex-col gap-4">
            <StatusBreakdown
              title="Projects"
              order={['PLANNED', 'ACTIVE', 'ON_HOLD', 'PENDING_APPROVAL', 'COMPLETED', 'CANCELLED']}
              meta={PROJECT_STATUS_META}
              data={data?.projectsByStatus}
            />
            <StatusBreakdown
              title="Tasks"
              order={['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']}
              meta={TASK_STATUS_META}
              data={data?.tasksByStatus}
            />
          </Reveal>
          <Reveal delay={120} className="lg:col-span-2">
            <DeadlinesPanel tasks={data?.upcomingDeadlines} projectsBasePath="/pm/projects" />
          </Reveal>
        </div>
      </div>

      {/* Timeline — the road-map view of this PM's active work */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Timeline" title="Active projects on the road" description="Start to deadline, at a glance." />
        </Reveal>
        <Reveal delay={80}>
          <ProjectRoute projects={data?.timeline} basePath="/pm/projects" />
        </Reveal>
      </div>

      {/* Activity — one premium widget, weekly pulse plus the detailed
          feed, both scoped to just this PM's own projects. */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Activity" title="Recent activity" description="Project, task, and team movement across your projects." />
        </Reveal>
        <Reveal delay={80}>
          <ActivityTimeline
            activityByDay={data?.activityByDay}
            logs={data?.recentActivity}
            basePath="/pm/projects"
            subtitle="Across your projects"
          />
        </Reveal>
      </div>
    </div>
  );
}
