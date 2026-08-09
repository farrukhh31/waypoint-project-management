import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  Bell,
  UserCircle,
  Route as RouteIcon,
  BarChart3,
  UsersRound,
  ClipboardCheck,
} from 'lucide-react';
import { ROLES } from './roles';

// Each entry: label, path, icon. Kept per-role so a portal only ever
// renders the links that role is actually allowed to use — the backend
// enforces this too, but the sidebar shouldn't advertise dead ends.
export const NAVIGATION = {
  [ROLES.ADMIN]: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Timeline', path: '/admin/timeline', icon: RouteIcon },
    { label: 'Projects', path: '/admin/projects', icon: FolderKanban },
    { label: 'Team workload', path: '/admin/team', icon: UsersRound },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Profile', path: '/admin/profile', icon: UserCircle },
  ],
  [ROLES.PROJECT_MANAGER]: [
    { label: 'Dashboard', path: '/pm', icon: LayoutDashboard, end: true },
    { label: 'My Projects', path: '/pm/projects', icon: FolderKanban },
    { label: 'Tasks', path: '/pm/tasks', icon: ListChecks },
    { label: 'Member reports', path: '/pm/reports/team', icon: ClipboardCheck },
    { label: 'Notifications', path: '/pm/notifications', icon: Bell },
    { label: 'Profile', path: '/pm/profile', icon: UserCircle },
  ],
  [ROLES.TEAM_MEMBER]: [
    { label: 'Dashboard', path: '/team', icon: LayoutDashboard, end: true },
    { label: 'My Projects', path: '/team/projects', icon: FolderKanban },
    { label: 'My Tasks', path: '/team/tasks', icon: ListChecks },
    { label: 'Notifications', path: '/team/notifications', icon: Bell },
    { label: 'Profile', path: '/team/profile', icon: UserCircle },
  ],
};
