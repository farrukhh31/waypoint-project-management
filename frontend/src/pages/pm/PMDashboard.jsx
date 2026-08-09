import { FolderKanban, ListChecks, CircleDashed, CheckCircle2, Eye } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import StatCard from '../../components/ui/StatCard.jsx';
import DeadlinesList from '../../components/shared/DeadlinesList.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';

export default function PMDashboard() {
  const { data, loading } = useDashboard();

  if (loading) return <FullScreenLoader />;

  const stats = data?.stats ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Assigned projects" value={stats.assignedProjects} icon={FolderKanban} accent="route" />
        <StatCard label="Total tasks" value={stats.totalTasks} icon={ListChecks} accent="route" />
        <StatCard label="Pending tasks" value={stats.pendingTasks} icon={CircleDashed} accent="accent" />
        <StatCard
          label="Needs your review"
          value={stats.tasksAwaitingReview}
          icon={Eye}
          accent="sky"
          hint={stats.tasksAwaitingReview > 0 ? 'Submitted and waiting on you' : "You're all caught up"}
          to="/pm/tasks?status=REVIEW"
        />
        <StatCard label="Completed tasks" value={stats.completedTasks} icon={CheckCircle2} accent="success" />
      </div>

      <DeadlinesList
        tasks={data?.upcomingDeadlines}
        linkTo={(task) => `/pm/tasks/${task.id}`}
      />
    </div>
  );
}
