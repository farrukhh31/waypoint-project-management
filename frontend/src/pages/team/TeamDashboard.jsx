import { useMemo } from 'react';
import clsx from 'clsx';
import { FolderKanban, ListChecks, CircleDashed, Send, CheckCircle2 } from 'lucide-react';
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
import DeadlinesPanel from '../../components/dashboard/DeadlinesPanel.jsx';
import ActivityFeed from '../../components/dashboard/ActivityFeed.jsx';
import DeadlineCounter from '../../components/dashboard/DeadlineCounter.jsx';
import OrgActivityFeed from '../../components/dashboard/OrgActivityFeed.jsx';
import TeamPerformance from '../../components/dashboard/TeamPerformance.jsx';
import TimeTrackingCard from '../../components/dashboard/TimeTrackingCard.jsx';
import MeetingsCard from '../../components/dashboard/MeetingsCard.jsx';
import { PROJECT_STATUSES, PROJECT_STATUS_META, PROJECT_STATUS_TONE, TASK_STATUSES, TASK_STATUS_META, TASK_STATUS_TONE } from '../../config/statuses';

// The Team Member's daily-driver view — same sectioned language as
// AdminDashboard/PMDashboard (Pulse / Today / Breakdown / Activity) so
// all three portals read as one consistent product, but every number,
// list, and link here is scoped to just this member's own assignments:
// no org-wide counts, no other members' workload, nothing a member has
// no reason (or permission) to see. Deliberately skips the two sections
// that only make sense for someone who manages other people's work —
// "Needs attention" (project risk/approvals) and "Team" (contributor
// comparisons) — since a member doesn't own projects or supervise anyone.
export default function TeamDashboard() {
  const { user } = useAuth();
  const { data, loading } = useDashboard();
  const { projects, tasks, loading: timelineLoading } = useTimeline();

  // One roster per project this member actually sits on — not just their
  // own tasks, so a member on two active projects sees who's contributing
  // on *each* of them separately, side by side, rather than one merged
  // (and less useful) org-wide leaderboard. Active projects only: a
  // finished/cancelled project's contributor mix isn't something a
  // member needs on their daily-driver dashboard.
  const contributorsByProject = useMemo(() => {
    const active = projects.filter((p) => p.status === 'ACTIVE');
    return active
      .map((project) => ({
        project,
        tasks: tasks.filter((t) => t.project?.id === project.id),
      }))
      .filter((entry) => entry.tasks.length > 0);
  }, [projects, tasks]);

  if (loading) return <FullScreenLoader />;

  const stats = data?.stats ?? {};

  return (
    <div className="flex flex-col gap-8">
      <Reveal>
        <WelcomeBanner
          name={user?.name}
          highlights={[
            { label: 'tasks assigned', value: stats.assignedTasks ?? 0, icon: ListChecks, to: '/team/tasks', tone: 'bg-route-100 text-route-600' },
            { label: 'awaiting review', value: stats.tasksAwaitingReview ?? 0, icon: Send, to: '/team/tasks?status=REVIEW', tone: 'bg-sky-100 text-sky-700' },
            { label: 'completed', value: stats.completedTasks ?? 0, icon: CheckCircle2, to: '/team/tasks', tone: 'bg-success-50 text-success-600' },
          ]}
        />
      </Reveal>

      {!timelineLoading && (
        <Reveal delay={20}>
          <DeadlineCounter tasks={tasks} projects={projects} tasksPath="/team/tasks" />
        </Reveal>
      )}

      {/* Pulse — the headline numbers for this member's own workload */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Pulse" title="Your workload, right now" description="Every project and task assigned to you." />
        </Reveal>
        <Reveal delay={50} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatusOverviewCard
            label="My projects"
            icon={FolderKanban}
            accent="route"
            total={stats.assignedProjects}
            data={data?.projectsByStatus}
            meta={PROJECT_STATUS_META}
            tone={PROJECT_STATUS_TONE}
            order={PROJECT_STATUSES}
            to="/team/projects"
          />
          <StatusOverviewCard
            label="My tasks"
            icon={ListChecks}
            accent="accent"
            total={stats.assignedTasks}
            data={data?.tasksByStatus}
            meta={TASK_STATUS_META}
            tone={TASK_STATUS_TONE}
            order={TASK_STATUSES}
            to="/team/tasks"
          />
        </Reveal>
        <Reveal delay={60} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Pending" value={stats.pendingTasks} icon={CircleDashed} accent="accent" tilt to="/team/tasks" />
          <StatCard
            label="Awaiting review"
            value={stats.tasksAwaitingReview}
            icon={Send}
            accent="sky"
            tilt
            hint={stats.tasksAwaitingReview > 0 ? 'Submitted — waiting on your PM' : 'Nothing submitted right now'}
            to="/team/tasks?status=REVIEW"
          />
          <StatCard label="Completed" value={stats.completedTasks} icon={CheckCircle2} accent="success" tilt />
          <CompletionRing completed={stats.completedTasks} total={stats.totalTasks} to="/team/tasks" />
        </Reveal>
      </div>

      {/* Today — this member's own active projects, tasks and schedule */}
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
                fullPath="/team/timeline"
                fullLabel="View full timeline"
                projectsBasePath="/team/projects"
                tasksBasePath="/team/tasks"
                simplified
              />
            )}
          </Reveal>
          <Reveal delay={120} className="flex flex-col gap-4">
            <TimeTrackingCard basePath="/team" />
            <MeetingsCard basePath="/team" />
          </Reveal>
        </div>
      </div>

      {/* Contributors — one leaderboard per active project this member is
          on, so being on two projects at once means two separate panels
          instead of one blended ranking that hides which project is which. */}
      {!timelineLoading && contributorsByProject.length > 0 && (
        <div className="flex flex-col gap-4">
          <Reveal delay={40}>
            <SectionHeading
              eyebrow="Contributors"
              title="Top contributors, per project"
              description={
                contributorsByProject.length > 1
                  ? "Who's moving the work on each project you're part of."
                  : "Who's moving the work on this project."
              }
            />
          </Reveal>
          <div className={clsx('grid grid-cols-1 gap-4', contributorsByProject.length > 1 && 'lg:grid-cols-2')}>
            {contributorsByProject.map(({ project, tasks: projectTasks }, i) => (
              <Reveal
                key={project.id}
                delay={80 + i * 40}
                className="h-full"
              >
                <TeamPerformance
                  tasks={projectTasks}
                  workloadPath={`/team/projects/${project.id}`}
                  workloadLabel="View project"
                  title={project.name}
                  subtitle="Top contributors · tasks completed"
                />
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown — composition + deadlines, this member's own work only */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Breakdown" title="Status &amp; deadlines" description="Where your projects and tasks currently sit." />
        </Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Reveal delay={80} className="flex flex-col gap-4">
            <StatusBreakdown
              title="Projects"
              order={['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']}
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
            <DeadlinesPanel tasks={data?.upcomingDeadlines} projectsBasePath="/team/projects" />
          </Reveal>
        </div>
      </div>

      {/* Activity — a quick weekly pulse plus the detailed feed, both
          scoped to just the projects this member sits on. */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Activity" title="Recent activity" description="Project and task movement on your projects." />
        </Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reveal delay={80}>
            <ActivityFeed activityByDay={data?.activityByDay} />
          </Reveal>
          <Reveal delay={120}>
            <OrgActivityFeed
              logs={data?.recentActivity}
              basePath="/team/projects"
              title="Detailed feed"
              subtitle="Across your projects"
            />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
