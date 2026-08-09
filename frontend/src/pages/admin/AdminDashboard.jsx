import { FolderKanban, Activity, Users, AlertTriangle, PauseCircle } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useTimeline } from '../../hooks/useTimeline';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/ui/StatCard.jsx';
import Card from '../../components/ui/Card.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';
import WelcomeBanner from '../../components/dashboard/WelcomeBanner.jsx';
import CompletionRing from '../../components/dashboard/CompletionRing.jsx';
import TimelineWidget from '../../components/dashboard/TimelineWidget.jsx';
import StatusBreakdown from '../../components/dashboard/StatusBreakdown.jsx';
import DeadlinesPanel from '../../components/dashboard/DeadlinesPanel.jsx';
import ActivityFeed from '../../components/dashboard/ActivityFeed.jsx';
import TimeTrackingCard from '../../components/dashboard/TimeTrackingCard.jsx';
import MeetingsCard from '../../components/dashboard/MeetingsCard.jsx';
import { PROJECT_STATUS_META, TASK_STATUS_META } from '../../config/statuses';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading } = useDashboard();
  const { projects, tasks, loading: timelineLoading } = useTimeline();

  if (loading) return <FullScreenLoader />;

  const stats = data?.stats ?? {};

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner name={user?.name} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total projects" value={stats.totalProjects} icon={FolderKanban} accent="route" tilt to="/admin/projects" />
        <StatCard label="Active projects" value={stats.activeProjects} icon={Activity} accent="accent" tilt to="/admin/projects?status=ACTIVE" />
        <StatCard label="On hold" value={stats.onHoldProjects} icon={PauseCircle} accent="danger" tilt to="/admin/projects?status=ON_HOLD" />
        <StatCard label="Total users" value={stats.totalUsers} icon={Users} accent="route" tilt to="/admin/users" />
        <StatCard label="Overdue tasks" value={stats.overdueTasks} icon={AlertTriangle} accent="danger" tilt />
        <CompletionRing completed={stats.completedTasks} total={stats.totalTasks} to="/admin/reports" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {timelineLoading ? (
            <Card className="flex h-64 items-center justify-center text-sm text-ink-muted">Loading timeline…</Card>
          ) : (
            <TimelineWidget projects={projects} tasks={tasks} fullPath="/admin/timeline" />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <TimeTrackingCard />
          <MeetingsCard />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
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
        </div>
        <div className="lg:col-span-2">
          <DeadlinesPanel tasks={data?.upcomingDeadlines} />
        </div>
      </div>

      <ActivityFeed activityByDay={data?.activityByDay} />
    </div>
  );
}