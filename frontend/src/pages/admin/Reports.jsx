import { useMemo, useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, FolderKanban, ListChecks, Users, AlertTriangle, Download, Sparkles } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useList } from '../../hooks/useList';
import StatCard from '../../components/ui/StatCard.jsx';
import Button from '../../components/ui/Button.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import SectionHeading from '../../components/dashboard/SectionHeading.jsx';
import StatusBreakdown from '../../components/dashboard/StatusBreakdown.jsx';
import CompletionRing from '../../components/dashboard/CompletionRing.jsx';
import PriorityBreakdown from '../../components/dashboard/PriorityBreakdown.jsx';
import TeamPerformance, { rankContributors } from '../../components/dashboard/TeamPerformance.jsx';
import ActivityTrendChart from '../../components/dashboard/ActivityTrendChart.jsx';
import HealthSnapshot from '../../components/dashboard/HealthSnapshot.jsx';
import UpcomingDeadlines from '../../components/dashboard/UpcomingDeadlines.jsx';
import AtRiskProjects from '../../components/dashboard/AtRiskProjects.jsx';
import ProjectRoute from '../../components/dashboard/ProjectRoute.jsx';
import OrgActivityFeed from '../../components/dashboard/OrgActivityFeed.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';
import ReportsTabs from '../../components/shared/ReportsTabs.jsx';
import { PROJECT_STATUS_META, TASK_STATUS_META } from '../../config/statuses';
import { downloadReportCsv } from '../../utils/exportReport';
import { formatRelativeTime } from '../../utils/formatDate';

function countByPriority(items) {
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
  items.forEach((item) => {
    if (counts[item.priority] != null) counts[item.priority] += 1;
  });
  return counts;
}

// The org-wide analytics pass: everything the dashboard endpoint returns
// but the dashboard page itself doesn't have room for (recentActivity, the
// active-projects `timeline`, and the previously-unsurfaced
// `upcomingDeadlines`), plus a live priority mix and risk view pulled from
// the projects/tasks list endpoints, laid out as its own scroll-revealed,
// sectioned bento page rather than squeezed under the daily-driver
// dashboard.
export default function Reports() {
  const { data, loading } = useDashboard();
  const { items: projects, loading: projectsLoading } = useList('/projects', 'projects', { limit: 100 });
  const { items: tasks, loading: tasksLoading } = useList('/tasks', 'tasks', { limit: 100 });
  const [asOf, setAsOf] = useState(null);

  useEffect(() => {
    if (!loading && data) setAsOf(new Date());
  }, [loading, data]);

  const dueSoon = useMemo(() => {
    const now = Date.now();
    const cutoff = now + 3 * 86400000;
    return tasks.filter((t) => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate).getTime() >= now && new Date(t.dueDate).getTime() <= cutoff).length;
  }, [tasks]);

  const contributors = useMemo(() => rankContributors(tasks), [tasks]);

  const atRiskProjects = useMemo(
    () =>
      projects
        .filter((p) => (p.progress?.overdue || 0) > 0)
        .sort((a, b) => (b.progress?.overdue || 0) - (a.progress?.overdue || 0)),
    [projects]
  );

  if (loading) return <FullScreenLoader />;

  const stats = data?.stats ?? {};
  const completionRate = stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const upcomingDeadlines = data?.upcomingDeadlines ?? [];

  function handleExport() {
    downloadReportCsv({
      stats: {
        'Total projects': stats.totalProjects ?? 0,
        'Total tasks': stats.totalTasks ?? 0,
        'Total users': stats.totalUsers ?? 0,
        'Overdue tasks': stats.overdueTasks ?? 0,
        'Due within 3 days': dueSoon,
        'Completion rate': `${completionRate}%`,
      },
      projectsByStatus: data?.projectsByStatus,
      tasksByStatus: data?.tasksByStatus,
      priorityCounts: { projects: countByPriority(projects), tasks: countByPriority(tasks) },
      contributors,
      atRiskProjects,
      upcomingDeadlines,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-route-500 text-white shadow-lg shadow-route-500/30">
            <BarChart3 className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-semibold text-ink">Reports &amp; analytics</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-[11px] font-semibold text-success-600">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success-500" />
                </span>
                Live
              </span>
            </div>
            <p className="text-sm text-ink-muted">
              A live pulse on every project, task, and team across the org.
              {asOf && <span className="text-ink-muted/70"> · Updated {formatRelativeTime(asOf.toISOString())}</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ReportsTabs basePath="/admin/reports" />
          <Button variant="secondary" size="sm" onClick={handleExport} className="rounded-full">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </Reveal>

      {/* Pulse — headline numbers, first thing anyone glancing at Reports should see */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Pulse" title="Org-wide numbers" description="Everything at a glance, right now." />
        </Reveal>
        <Reveal delay={60} className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total projects" value={stats.totalProjects} icon={FolderKanban} accent="route" tilt to="/admin/projects" />
          <StatCard label="Total tasks" value={stats.totalTasks} icon={ListChecks} accent="accent" tilt to="/admin/tasks" />
          <StatCard label="Total users" value={stats.totalUsers} icon={Users} accent="sky" tilt to="/admin/users" />
          <StatCard label="Overdue tasks" value={stats.overdueTasks} icon={AlertTriangle} accent="danger" tilt to="/admin/tasks?status=OVERDUE" />
          <StatCard label="Completion rate" value={`${completionRate}%`} icon={CheckCircle2} accent="success" tilt />
          <CompletionRing completed={stats.completedTasks} total={stats.totalTasks} />
        </Reveal>
      </div>

      {/* Trends — how the week has moved, and the quiet risk counters beside it */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Trends" title="Momentum this week" description="Activity volume and the things quietly piling up." />
        </Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Reveal delay={80} className="lg:col-span-2">
            <ActivityTrendChart />
          </Reveal>
          <Reveal delay={140}>
            <HealthSnapshot
              onHold={stats.onHoldProjects}
              pendingApproval={stats.pendingApprovalProjects}
              overdue={stats.overdueTasks}
              dueSoon={tasksLoading ? undefined : dueSoon}
            />
          </Reveal>
        </div>
      </div>

      {/* Needs attention — the two lists that turn "everything's fine" numbers
          into "here's exactly what to look at next" */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading
            eyebrow="Needs attention"
            title="What to look at next"
            description="Deadlines coming up, and projects already carrying overdue work."
          />
        </Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reveal delay={80}>
            <UpcomingDeadlines tasks={upcomingDeadlines} basePath="/admin/tasks" />
          </Reveal>
          <Reveal delay={120}>
            {projectsLoading ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-line bg-surface text-sm text-ink-muted">
                Scanning projects…
              </div>
            ) : (
              <AtRiskProjects projects={projects} />
            )}
          </Reveal>
        </div>
      </div>

      {/* Breakdown — status/priority composition, and who's actually moving the work */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Breakdown" title="Composition &amp; contributors" description="Where things stand, and who's closing them out." />
        </Reveal>
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          <Reveal delay={80} className="flex h-full flex-col justify-center gap-4">
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
          <Reveal delay={140} className="h-full">
            {projectsLoading || tasksLoading ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-line bg-surface text-sm text-ink-muted">
                Crunching priorities…
              </div>
            ) : (
              <PriorityBreakdown projects={projects} tasks={tasks} />
            )}
          </Reveal>
          <Reveal delay={200} className="h-full">
            {tasksLoading ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-line bg-surface text-sm text-ink-muted">
                Ranking contributors…
              </div>
            ) : (
              <TeamPerformance tasks={tasks} />
            )}
          </Reveal>
        </div>
      </div>

      {/* Timeline — the road-map view of active work */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Timeline" title="Active projects on the road" description="Start to deadline, at a glance." />
        </Reveal>
        <Reveal delay={80}>
          <ProjectRoute projects={data?.timeline} />
        </Reveal>
      </div>

      {/* Activity — the raw, unfiltered feed for anyone who wants the detail */}
      <div className="flex flex-col gap-4">
        <Reveal delay={40}>
          <SectionHeading eyebrow="Activity" title="Everything, as it happens" description="The unfiltered feed, across every project." />
        </Reveal>
        <Reveal delay={80}>
          <OrgActivityFeed logs={data?.recentActivity} />
        </Reveal>
      </div>

      <Reveal delay={40} className="flex items-center justify-center gap-2 pb-2 text-xs text-ink-muted">
        <Sparkles className="h-3.5 w-3.5" />
        That's everything Waypoint is tracking right now.
      </Reveal>
    </div>
  );
}
