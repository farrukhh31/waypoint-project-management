import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout.jsx';
import PortalLayout from './layouts/PortalLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import { ROLES, ROLE_HOME } from './config/roles';
import { useAuth } from './hooks/useAuth';
import { useMinDuration } from './hooks/useMinDuration';

// Route-level code splitting: every page is its own chunk, fetched only
// when its route is actually visited, instead of one monolithic bundle
// that ships all three portals (admin/pm/team) to every user up front.
const Login = lazy(() => import('./pages/auth/Login.jsx'));
const Register = lazy(() => import('./pages/auth/Register.jsx'));
const AcceptInvite = lazy(() => import('./pages/auth/AcceptInvite.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const Users = lazy(() => import('./pages/admin/Users.jsx'));
const Timeline = lazy(() => import('./pages/admin/Timeline.jsx'));
const Reports = lazy(() => import('./pages/admin/Reports.jsx'));
const TeamWorkload = lazy(() => import('./pages/admin/TeamWorkload.jsx'));
const MemberReports = lazy(() => import('./pages/shared/MemberReports.jsx'));
const PMDashboard = lazy(() => import('./pages/pm/PMDashboard.jsx'));
const Members = lazy(() => import('./pages/pm/Members.jsx'));
const TeamDashboard = lazy(() => import('./pages/team/TeamDashboard.jsx'));
const Projects = lazy(() => import('./pages/shared/Projects.jsx'));
const ProjectDetails = lazy(() => import('./pages/shared/ProjectDetails.jsx'));
const Tasks = lazy(() => import('./pages/shared/Tasks.jsx'));
const TaskDetails = lazy(() => import('./pages/shared/TaskDetails.jsx'));
const Meetings = lazy(() => import('./pages/shared/Meetings.jsx'));
const TimeTracking = lazy(() => import('./pages/shared/TimeTracking.jsx'));
const Notifications = lazy(() => import('./pages/shared/Notifications.jsx'));
const Profile = lazy(() => import('./pages/shared/Profile.jsx'));
const Settings = lazy(() => import('./pages/shared/Settings.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
import FullScreenLoader from './components/ui/FullScreenLoader.jsx';
import TopProgressBar from './components/ui/TopProgressBar.jsx';
import SessionToast from './components/ui/SessionToast.jsx';

export default function App() {
  const { status, user } = useAuth();
  const showBootLoader = useMinDuration(status === 'loading', 700);

  if (showBootLoader) return <FullScreenLoader />;

  return (
    <>
    <TopProgressBar />
    <SessionToast />
    <Suspense fallback={<FullScreenLoader />}>
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
            <Route path="tasks" element={<Tasks basePath="/admin/tasks" />} handle={{ title: 'Tasks' }} />
            <Route path="tasks/:id" element={<TaskDetails />} handle={{ title: 'Task' }} />
            <Route path="team" element={<TeamWorkload />} handle={{ title: 'Team workload' }} />
            <Route path="reports/team" element={<MemberReports basePath="/admin/reports" />} handle={{ title: 'Member Reports' }} />
            <Route path="reports" element={<Reports />} handle={{ title: 'Reports' }} />
            <Route path="users" element={<Users />} handle={{ title: 'Users' }} />
            <Route path="meetings" element={<Meetings />} handle={{ title: 'Meetings' }} />
            <Route path="time-tracking" element={<TimeTracking />} handle={{ title: 'Time Tracking' }} />
            <Route path="notifications" element={<Notifications />} handle={{ title: 'Notifications' }} />
            <Route path="profile" element={<Profile />} handle={{ title: 'Profile' }} />
            <Route path="settings" element={<Settings />} handle={{ title: 'Settings' }} />
          </Route>
        </Route>

        {/* Project Manager portal */}
        <Route element={<RoleRoute allow={[ROLES.PROJECT_MANAGER]} />}>
          <Route path="/pm" element={<PortalLayout />}>
            <Route index element={<PMDashboard />} handle={{ title: 'Dashboard' }} />
            <Route path="timeline" element={<Timeline basePath="/pm" description="Your projects and tasks, laid out on one shared road." />} handle={{ title: 'Timeline' }} />
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
            <Route path="members" element={<Members />} handle={{ title: 'My Team' }} />
            <Route path="reports/team" element={<MemberReports />} handle={{ title: 'Member Reports' }} />
            <Route path="meetings" element={<Meetings />} handle={{ title: 'Meetings' }} />
            <Route path="time-tracking" element={<TimeTracking />} handle={{ title: 'Time Tracking' }} />
            <Route path="notifications" element={<Notifications />} handle={{ title: 'Notifications' }} />
            <Route path="profile" element={<Profile />} handle={{ title: 'Profile' }} />
            <Route path="settings" element={<Settings />} handle={{ title: 'Settings' }} />
          </Route>
        </Route>

        {/* Team Member portal */}
        <Route element={<RoleRoute allow={[ROLES.TEAM_MEMBER]} />}>
          <Route path="/team" element={<PortalLayout />}>
            <Route index element={<TeamDashboard />} handle={{ title: 'Dashboard' }} />
            <Route
              path="timeline"
              element={<Timeline basePath="/team" description="Your projects and tasks, laid out on one shared road." readOnly />}
              handle={{ title: 'Timeline' }}
            />
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
            <Route path="meetings" element={<Meetings />} handle={{ title: 'Meetings' }} />
            <Route path="time-tracking" element={<TimeTracking />} handle={{ title: 'Time Tracking' }} />
            <Route path="notifications" element={<Notifications />} handle={{ title: 'Notifications' }} />
            <Route path="profile" element={<Profile />} handle={{ title: 'Profile' }} />
            <Route path="settings" element={<Settings />} handle={{ title: 'Settings' }} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
    </>
  );
}