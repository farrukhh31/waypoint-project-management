import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  Users2,
  Bell,
  UserCircle,
  Route as RouteIcon,
  BarChart3,
  UsersRound,
  ClipboardCheck,
  CalendarClock,
  Timer,
  Settings,
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
    { label: 'Tasks', path: '/admin/tasks', icon: ListChecks },
    { label: 'Team workload', path: '/admin/team', icon: UsersRound },
    { label: 'Meetings', path: '/admin/meetings', icon: CalendarClock },
    { label: 'Time Tracking', path: '/admin/time-tracking', icon: Timer },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Profile', path: '/admin/profile', icon: UserCircle },
  ],
  [ROLES.PROJECT_MANAGER]: [
    { label: 'Dashboard', path: '/pm', icon: LayoutDashboard, end: true },
    { label: 'Timeline', path: '/pm/timeline', icon: RouteIcon },
    { label: 'My Projects', path: '/pm/projects', icon: FolderKanban },
    { label: 'Tasks', path: '/pm/tasks', icon: ListChecks },
    { label: 'My Team', path: '/pm/members', icon: Users2 },
    { label: 'Meetings', path: '/pm/meetings', icon: CalendarClock },
    { label: 'Time Tracking', path: '/pm/time-tracking', icon: Timer },
    { label: 'Member reports', path: '/pm/reports/team', icon: ClipboardCheck },
    { label: 'Notifications', path: '/pm/notifications', icon: Bell },
    { label: 'Profile', path: '/pm/profile', icon: UserCircle },
  ],
  [ROLES.TEAM_MEMBER]: [
    { label: 'Dashboard', path: '/team', icon: LayoutDashboard, end: true },
    { label: 'Timeline', path: '/team/timeline', icon: RouteIcon },
    { label: 'My Projects', path: '/team/projects', icon: FolderKanban },
    { label: 'My Tasks', path: '/team/tasks', icon: ListChecks },
    { label: 'Meetings', path: '/team/meetings', icon: CalendarClock },
    { label: 'Time Tracking', path: '/team/time-tracking', icon: Timer },
    { label: 'Notifications', path: '/team/notifications', icon: Bell },
    { label: 'Profile', path: '/team/profile', icon: UserCircle },
  ],
};

// Utility links rendered below a divider, separate from the main "Menu"
// list — currently just Settings, kept its own group so the sidebar can
// grow more account-level links later (Help, Integrations, ...) without
// mixing them into the primary work nav. See src/pages/shared/Settings.jsx.
export const SECONDARY_NAVIGATION = {
  [ROLES.ADMIN]: [{ label: 'Settings', path: '/admin/settings', icon: Settings }],
  [ROLES.PROJECT_MANAGER]: [{ label: 'Settings', path: '/pm/settings', icon: Settings }],
  [ROLES.TEAM_MEMBER]: [{ label: 'Settings', path: '/team/settings', icon: Settings }],
};
