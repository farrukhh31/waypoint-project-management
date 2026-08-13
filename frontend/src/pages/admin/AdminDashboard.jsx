import { FolderKanban, Activity, Users, AlertTriangle, PauseCircle, BarChart3, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import { useTimeline } from '../../hooks/useTimeline';
import { useAuth } from '../../hooks/useAuth';
import { useList } from '../../hooks/useList';
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
import DeadlineCounter from '../../components/dashboard/DeadlineCounter.jsx';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline.jsx';
import TimeTrackingCard from '../../components/dashboard/TimeTrackingCard.jsx';
import MeetingsCard from '../../components/dashboard/MeetingsCard.jsx';
import HealthSnapshot from '../../components/dashboard/HealthSnapshot.jsx';
import AtRiskProjects from '../../components/dashboard/AtRiskProjects.jsx';
import { PROJECT_STATUSES, PROJECT_STATUS_META, PROJECT_STATUS_TONE, TASK_STATUSES, TASK_STATUS_META, TASK_STATUS_TONE } from '../../config/statuses';

// The daily-driver view: a fast, glanceable pulse on the org, with a
// "Needs attention" section borrowed from Reports (HealthSnapshot +
// AtRiskProjects) so risk is visible without leaving the dashboard —
// Reports itself stays the place for deeper trend/priority/contributor
// analysis. Sectioned + scroll-revealed like Reports so the two pages
// read as one consistent, premium design language rather than an
// upgraded page next to a plain one.
export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading } = useDashboard();
  const { projects, tasks, loading: timelineLoading } = useTimeline();
  const { items: riskProjects, loading: riskLoading } = useList('/projects', 'projects', { limit: 100 });

  if (loading) return <FullScreenLoader />;

  const stats = data?.stats ?? {};

  return (
    <div className="flex flex-col gap-8">
      <Reveal>
        <WelcomeBanner
          name={user?.name}
          highlights={[
            { label: 'active projects', value: stats.activeProjects ?? 0, icon: Activity, to: '/admin/projects?status=ACTIVE', tone: 'bg-route-100 text-route-600' },
            { label: 'overdue tasks', value: stats.overdueTasks ?? 0, icon: AlertTriangle, to: '/admin/tasks?status=OVERDUE', tone: 'bg-danger-50 text-danger-600' },
            { label: 'total users', value: stats.totalUsers ?? 0, icon: Users, to: '/admin/users', tone: 'bg-sky-100 text-sky-700' },
          ]}
        />
      </Reveal>

      {!timelineLoading && (
        <Reveal delay={20}>
          <DeadlineCounter tasks={tasks} projects={projects} tasksPath="/admin/tasks" />
        </Reveal>
      )}

      {/* Pulse — the same headline numbers Reports opens with, so the two
          pages feel like one continuous language rather than two styles. */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading
            eyebrow="Pulse"
            title="Org-wide numbers"
            description="Everything at a glance, right now."
            action={
              <Link
                to="/admin/reports"
                className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-route-200 hover:text-route-600 hover:shadow-card"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Full reports
              </Link>
            }
          />
        </Reveal>
        <Reveal delay={50} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatusOverviewCard
            label="Total projects"
            icon={FolderKanban}
            accent="route"
            total={stats.totalProjects}
            data={data?.projectsByStatus}
            meta={PROJECT_STATUS_META}
            tone={PROJECT_STATUS_TONE}
            order={PROJECT_STATUSES}
            to="/admin/projects"
          />
          <StatusOverviewCard
            label="All tasks"
            icon={ListChecks}
            accent="accent"
            total={stats.totalTasks}
            data={data?.tasksByStatus}
            meta={TASK_STATUS_META}
            tone={TASK_STATUS_TONE}
            order={TASK_STATUSES}
            to="/admin/projects"
          />
        </Reveal>
        <Reveal delay={60} className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Active projects" value={stats.activeProjects} icon={Activity} accent="accent" tilt to="/admin/projects?status=ACTIVE" />
          <StatCard label="On hold" value={stats.onHoldProjects} icon={PauseCircle} accent="danger" tilt to="/admin/projects?status=ON_HOLD" />
          <StatCard label="Total users" value={stats.totalUsers} icon={Users} accent="route" tilt to="/admin/users" />
          <StatCard label="Overdue tasks" value={stats.overdueTasks} icon={AlertTriangle} accent="danger" tilt to="/admin/tasks?status=OVERDUE" />
          <CompletionRing completed={stats.completedTasks} total={stats.totalTasks} to="/admin/reports" />
        </Reveal>
      </div>

      {/* Today — the roadmap plus what's actually on the calendar/clock */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Today" title="Roadmap &amp; schedule" description="Where projects stand, and what's coming up next." />
        </Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Reveal delay={80} className="lg:col-span-2">
            {timelineLoading ? (
              <Card className="flex h-64 items-center justify-center text-sm text-ink-muted">Loading timeline…</Card>
            ) : (
              <TimelineWidget projects={projects} tasks={tasks} fullPath="/admin/timeline" />
            )}
          </Reveal>
          <Reveal delay={120} className="flex flex-col gap-4">
            <TimeTrackingCard basePath="/admin" />
            <MeetingsCard basePath="/admin" />
          </Reveal>
        </div>
      </div>

      {/* Needs attention — pulled straight from Reports: the quiet risk
          counters plus the projects actually carrying overdue work, so
          nothing needs a trip to the full report to be noticed. */}
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
            />
          </Reveal>
          <Reveal delay={120}>
            {riskLoading ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-line bg-surface text-sm text-ink-muted">
                Scanning projects…
              </div>
            ) : (
              <AtRiskProjects projects={riskProjects} />
            )}
          </Reveal>
        </div>
      </div>

      {/* Breakdown — composition + deadlines */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Breakdown" title="Status &amp; deadlines" description="Where every project and task currently sits." />
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
            <DeadlinesPanel tasks={data?.upcomingDeadlines} />
          </Reveal>
        </div>
      </div>

      {/* Activity */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Activity" title="Recent activity" description="Project, task, and team movement this week." />
        </Reveal>
        <Reveal delay={80}>
          <ActivityTimeline
            activityByDay={data?.activityByDay}
            logs={data?.recentActivity}
            basePath="/admin/projects"
            subtitle="Across every project"
          />
        </Reveal>
      </div>
    </div>
  );
}
