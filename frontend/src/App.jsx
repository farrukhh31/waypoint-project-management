import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout.jsx';
import PortalLayout from './layouts/PortalLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import { ROLES, ROLE_HOME } from './config/roles';
import { useAuth } from './hooks/useAuth';
import { useMinDuration } from './hooks/useMinDuration';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import AcceptInvite from './pages/auth/AcceptInvite.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Users from './pages/admin/Users.jsx';
import Timeline from './pages/admin/Timeline.jsx';
import Reports from './pages/admin/Reports.jsx';
import TeamWorkload from './pages/admin/TeamWorkload.jsx';
import MemberReports from './pages/shared/MemberReports.jsx';
import PMDashboard from './pages/pm/PMDashboard.jsx';
import TeamDashboard from './pages/team/TeamDashboard.jsx';
import Projects from './pages/shared/Projects.jsx';
import ProjectDetails from './pages/shared/ProjectDetails.jsx';
import Tasks from './pages/shared/Tasks.jsx';
import TaskDetails from './pages/shared/TaskDetails.jsx';
import Notifications from './pages/shared/Notifications.jsx';
import Profile from './pages/shared/Profile.jsx';
import NotFound from './pages/NotFound.jsx';
import FullScreenLoader from './components/ui/FullScreenLoader.jsx';
import TopProgressBar from './components/ui/TopProgressBar.jsx';

export default function App() {
  const { status, user } = useAuth();
  const showBootLoader = useMinDuration(status === 'loading', 700);

  if (showBootLoader) return <FullScreenLoader />;

  return (
    <>
    <TopProgressBar />
    <Routes>
      {/* Public */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={status === 'authenticated' ? <Navigate to={ROLE_HOME[user.role]} replace /> : <Login />}
        />
        <Route
          path="/register"
          element={status === 'authenticated' ? <Navigate to={ROLE_HOME[user.role]} replace /> : <Register />}
        />
        <Route
          path="/accept-invite"
          element={status === 'authenticated' ? <Navigate to={ROLE_HOME[user.role]} replace /> : <AcceptInvite />}
        />
      </Route>

      {/* Authenticated */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to={status === 'authenticated' ? ROLE_HOME[user.role] : '/login'} replace />} />

        {/* Administrator portal */}
        <Route element={<RoleRoute allow={[ROLES.ADMIN]} />}>
          <Route path="/admin" element={<PortalLayout />}>
            <Route index element={<AdminDashboard />} handle={{ title: 'Dashboard' }} />
            <Route path="timeline" element={<Timeline />} handle={{ title: 'Timeline' }} />
            <Route
              path="projects"
              element={<Projects basePath="/admin/projects" />}
              handle={{ title: 'Projects' }}
            />
            <Route
              path="projects/:id"
              element={<ProjectDetails tasksBasePath="/admin/tasks" />}
              handle={{ title: 'Project' }}
            />
            <Route path="tasks/:id" element={<TaskDetails />} handle={{ title: 'Task' }} />
            <Route path="team" element={<TeamWorkload />} handle={{ title: 'Team workload' }} />
            <Route path="reports/team" element={<MemberReports basePath="/admin/reports" />} handle={{ title: 'Member Reports' }} />
            <Route path="reports" element={<Reports />} handle={{ title: 'Reports' }} />
            <Route path="users" element={<Users />} handle={{ title: 'Users' }} />
            <Route path="notifications" element={<Notifications />} handle={{ title: 'Notifications' }} />
            <Route path="profile" element={<Profile />} handle={{ title: 'Profile' }} />
          </Route>
        </Route>

        {/* Project Manager portal */}
        <Route element={<RoleRoute allow={[ROLES.PROJECT_MANAGER]} />}>
          <Route path="/pm" element={<PortalLayout />}>
            <Route index element={<PMDashboard />} handle={{ title: 'Dashboard' }} />
            <Route
              path="projects"
              element={<Projects basePath="/pm/projects" />}
              handle={{ title: 'My Projects' }}
            />
            <Route
              path="projects/:id"
              element={<ProjectDetails tasksBasePath="/pm/tasks" />}
              handle={{ title: 'Project' }}
            />
            <Route path="tasks" element={<Tasks basePath="/pm/tasks" />} handle={{ title: 'Tasks' }} />
            <Route path="tasks/:id" element={<TaskDetails />} handle={{ title: 'Task' }} />
            <Route path="reports/team" element={<MemberReports />} handle={{ title: 'Member Reports' }} />
            <Route path="notifications" element={<Notifications />} handle={{ title: 'Notifications' }} />
            <Route path="profile" element={<Profile />} handle={{ title: 'Profile' }} />
          </Route>
        </Route>

        {/* Team Member portal */}
        <Route element={<RoleRoute allow={[ROLES.TEAM_MEMBER]} />}>
          <Route path="/team" element={<PortalLayout />}>
            <Route index element={<TeamDashboard />} handle={{ title: 'Dashboard' }} />
            <Route
              path="projects"
              element={<Projects basePath="/team/projects" />}
              handle={{ title: 'My Projects' }}
            />
            <Route
              path="projects/:id"
              element={<ProjectDetails tasksBasePath="/team/tasks" />}
              handle={{ title: 'Project' }}
            />
            <Route path="tasks" element={<Tasks basePath="/team/tasks" />} handle={{ title: 'My Tasks' }} />
            <Route path="tasks/:id" element={<TaskDetails />} handle={{ title: 'Task' }} />
            <Route path="notifications" element={<Notifications />} handle={{ title: 'Notifications' }} />
            <Route path="profile" element={<Profile />} handle={{ title: 'Profile' }} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}
