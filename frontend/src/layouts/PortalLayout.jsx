import { Outlet, useLocation, matchPath } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useAuth } from '../hooks/useAuth';

// Mirrors the `handle={{ title }}` values on each <Route> in App.jsx.
// useMatches() would normally read those directly, but that hook only
// works with React Router's data router (createBrowserRouter), and this
// app uses plain <BrowserRouter>/<Routes> — so we match on path instead.
const TITLE_ROUTES = [
  ['/admin', 'Dashboard'],
  ['/admin/timeline', 'Timeline'],
  ['/admin/projects', 'Projects'],
  ['/admin/projects/:id', 'Project'],
  ['/admin/tasks/:id', 'Task'],
  ['/admin/team', 'Team workload'],
  ['/admin/reports', 'Reports'],
  ['/admin/reports/team', 'Reports'],
  ['/admin/users', 'Users'],
  ['/admin/notifications', 'Notifications'],
  ['/admin/profile', 'Profile'],
  ['/pm', 'Dashboard'],
  ['/pm/projects', 'My Projects'],
  ['/pm/projects/:id', 'Project'],
  ['/pm/tasks', 'Tasks'],
  ['/pm/tasks/:id', 'Task'],
  ['/pm/reports/team', 'Member Reports'],
  ['/pm/notifications', 'Notifications'],
  ['/pm/profile', 'Profile'],
  ['/team', 'Dashboard'],
  ['/team/projects', 'My Projects'],
  ['/team/projects/:id', 'Project'],
  ['/team/tasks', 'My Tasks'],
  ['/team/tasks/:id', 'Task'],
  ['/team/notifications', 'Notifications'],
  ['/team/profile', 'Profile'],
];

function useRouteTitle() {
  const location = useLocation();
  const match = TITLE_ROUTES.find(([pattern]) => matchPath({ path: pattern, end: true }, location.pathname));
  return match?.[1] ?? 'Waypoint';
}

// Shared shell for all three portals.
export default function PortalLayout() {
  const { user } = useAuth();
  const title = useRouteTitle();

  return (
    <div className="flex h-screen bg-paper">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
