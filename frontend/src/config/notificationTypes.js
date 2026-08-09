import {
  UserPlus,
  RefreshCcw,
  MessageSquare,
  AlarmClock,
  FolderPlus,
  UsersRound,
  Send,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

// Mirrors the Notification.type ENUM in the backend model. Each entry drives
// the icon chip, label, and accent used on the Notifications page, the bell
// preview, and the preferences panel — one place so they can't drift apart.
export const NOTIFICATION_TYPES = [
  'TASK_ASSIGNED',
  'TASK_STATUS_CHANGED',
  'DISCUSSION_ADDED',
  'DEADLINE_APPROACHING',
  'PROJECT_ASSIGNED',
  'MEMBER_ADDED',
  'TASK_SUBMITTED',
  'TASK_APPROVED',
  'TASK_CHANGES_REQUESTED',
  'PROJECT_SUBMITTED',
  'PROJECT_APPROVED',
  'PROJECT_CHANGES_REQUESTED',
];

export const NOTIFICATION_TYPE_META = {
  TASK_ASSIGNED: {
    label: 'Task assigned',
    icon: UserPlus,
    chip: 'bg-route-500 text-white',
    dot: 'bg-route-500',
    wash: 'bg-route-50/60',
  },
  TASK_STATUS_CHANGED: {
    label: 'Status changes',
    icon: RefreshCcw,
    chip: 'bg-sky-400 text-white',
    dot: 'bg-sky-400',
    wash: 'bg-sky-50/60',
  },
  DISCUSSION_ADDED: {
    label: 'Discussion activity',
    icon: MessageSquare,
    chip: 'bg-teal-400 text-white',
    dot: 'bg-teal-400',
    wash: 'bg-teal-50/60',
  },
  DEADLINE_APPROACHING: {
    label: 'Deadline reminders',
    icon: AlarmClock,
    chip: 'bg-accent-400 text-white',
    dot: 'bg-accent-400',
    wash: 'bg-accent-50/60',
  },
  PROJECT_ASSIGNED: {
    label: 'Project assignments',
    icon: FolderPlus,
    chip: 'bg-danger-400 text-white',
    dot: 'bg-danger-400',
    wash: 'bg-danger-50/60',
  },
  MEMBER_ADDED: {
    label: 'Team changes',
    icon: UsersRound,
    chip: 'bg-success-400 text-white',
    dot: 'bg-success-400',
    wash: 'bg-success-50/60',
  },
  TASK_SUBMITTED: {
    label: 'Task submitted',
    icon: Send,
    chip: 'bg-sky-500 text-white',
    dot: 'bg-sky-500',
    wash: 'bg-sky-50/60',
  },
  TASK_APPROVED: {
    label: 'Task approved',
    icon: CheckCircle2,
    chip: 'bg-success-500 text-white',
    dot: 'bg-success-500',
    wash: 'bg-success-50/60',
  },
  TASK_CHANGES_REQUESTED: {
    label: 'Changes requested',
    icon: RotateCcw,
    chip: 'bg-danger-500 text-white',
    dot: 'bg-danger-500',
    wash: 'bg-danger-50/60',
  },
  PROJECT_SUBMITTED: {
    label: 'Project submitted',
    icon: Send,
    chip: 'bg-sky-500 text-white',
    dot: 'bg-sky-500',
    wash: 'bg-sky-50/60',
  },
  PROJECT_APPROVED: {
    label: 'Project approved',
    icon: CheckCircle2,
    chip: 'bg-success-500 text-white',
    dot: 'bg-success-500',
    wash: 'bg-success-50/60',
  },
  PROJECT_CHANGES_REQUESTED: {
    label: 'Project changes requested',
    icon: RotateCcw,
    chip: 'bg-danger-500 text-white',
    dot: 'bg-danger-500',
    wash: 'bg-danger-50/60',
  },
};

export const DEFAULT_NOTIFICATION_META = {
  label: 'Notification',
  icon: UserPlus,
  chip: 'bg-ink-muted text-white',
  dot: 'bg-ink-muted',
  wash: 'bg-ink-muted/5',
};
