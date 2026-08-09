import { CheckCircle2, FolderKanban, ListChecks } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import StatCard from '../../components/ui/StatCard.jsx';
import StatusBreakdown from '../../components/dashboard/StatusBreakdown.jsx';
import CompletionRing from '../../components/dashboard/CompletionRing.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';
import ReportsTabs from '../../components/shared/ReportsTabs.jsx';
import { PROJECT_STATUS_META, TASK_STATUS_META } from '../../config/statuses';

// A first analytics pass built entirely on data the dashboard endpoint
// already returns — status breakdowns plus the completion ring, laid
// out as a dedicated page rather than squeezed into the dashboard.
export default function Reports() {
  const { data, loading } = useDashboard();

  if (loading) return <FullScreenLoader />;

  const stats = data?.stats ?? {};
  const completionRate = stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <ReportsTabs basePath="/admin/reports" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total projects" value={stats.totalProjects} icon={FolderKanban} accent="route" />
        <StatCard label="Total tasks" value={stats.totalTasks} icon={ListChecks} accent="accent" />
        <StatCard label="Completion rate" value={`${completionRate}%`} icon={CheckCircle2} accent="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2 sm:flex-row">
          <div className="flex-1">
            <StatusBreakdown
              title="Projects"
              order={['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']}
              meta={PROJECT_STATUS_META}
              data={data?.projectsByStatus}
            />
          </div>
          <div className="flex-1">
            <StatusBreakdown
              title="Tasks"
              order={['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']}
              meta={TASK_STATUS_META}
              data={data?.tasksByStatus}
            />
          </div>
        </div>
        <CompletionRing completed={stats.completedTasks} total={stats.totalTasks} />
      </div>
    </div>
  );
}
