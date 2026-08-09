import { FolderKanban, ListChecks, CircleDashed, CheckCircle2, Send } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import StatCard from '../../components/ui/StatCard.jsx';
import DeadlinesList from '../../components/shared/DeadlinesList.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';

export default function TeamDashboard() {
  const { data, loading } = useDashboard();

  if (loading) return <FullScreenLoader />;

  const stats = data?.stats ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="My projects" value={stats.assignedProjects} icon={FolderKanban} accent="route" />
        <StatCard label="Assigned tasks" value={stats.assignedTasks} icon={ListChecks} accent="route" />
        <StatCard label="Pending" value={stats.pendingTasks} icon={CircleDashed} accent="accent" />
        <StatCard
          label="Awaiting review"
          value={stats.tasksAwaitingReview}
          icon={Send}
          accent="sky"
          hint={stats.tasksAwaitingReview > 0 ? 'Submitted — waiting on your PM' : 'Nothing submitted right now'}
          to="/team/tasks?status=REVIEW"
        />
        <StatCard label="Completed" value={stats.completedTasks} icon={CheckCircle2} accent="success" />
      </div>

      <DeadlinesList
        tasks={data?.upcomingDeadlines}
        linkTo={(task) => `/team/tasks/${task.id}`}
      />
    </div>
  );
}
