import { Link } from 'react-router-dom';
import {
  FolderPlus,
  Pencil,
  Users,
  UserMinus,
  ListPlus,
  Send,
  Undo2,
  MessageSquare,
  Activity as ActivityIcon,
} from 'lucide-react';
import clsx from 'clsx';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import Avatar from '../ui/Avatar.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { formatRelativeTime } from '../../utils/formatDate';

// Mirrors ActivityTimeline's per-project action copy, plus a tone so each
// row gets a small colored badge instead of a plain bullet — same
// project/task/team palette the weekly pill chart and trend line use.
export const ACTION_META = {
  project_created: { label: 'created the project', icon: FolderPlus, tone: 'route' },
  project_updated: { label: 'updated the project details', icon: Pencil, tone: 'route' },
  project_submitted: { label: 'submitted the project for approval', icon: Send, tone: 'sky' },
  project_submission_undone: { label: 'undid the project submission', icon: Undo2, tone: 'ink' },
  task_created: { label: 'created a task', icon: ListPlus, tone: 'accent' },
  task_updated: { label: 'updated a task', icon: Pencil, tone: 'accent' },
  task_submitted: { label: 'submitted a task for review', icon: Send, tone: 'sky' },
  task_submission_undone: { label: 'undid the task submission', icon: Undo2, tone: 'ink' },
  members_added: { label: 'added team members', icon: Users, tone: 'success' },
  member_removed: { label: 'removed a team member', icon: UserMinus, tone: 'danger' },
  discussion_added: { label: 'commented', icon: MessageSquare, tone: 'teal' },
};

export const TONE_DOT = {
  route: 'bg-route-500',
  accent: 'bg-accent-400',
  success: 'bg-success-400',
  danger: 'bg-danger-400',
  sky: 'bg-sky-400',
  teal: 'bg-teal-400',
  ink: 'bg-ink-muted/60',
};

export function describe(log) {
  return ACTION_META[log.action] || { label: log.action.replace(/_/g, ' '), icon: ActivityIcon, tone: 'ink' };
}

export default function OrgActivityFeed({ logs = [], basePath = '/admin/projects', title = 'Recent activity', subtitle = 'Across every project' }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-pop">
      <CardHeader className="bg-gradient-to-r from-success-400/10 via-surface to-surface">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
          <p className="text-xs text-ink-muted">{subtitle}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-100 text-success-700">
          <ActivityIcon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col justify-center p-2">
        {logs.length === 0 ? (
          <div className="p-3">
            <EmptyState title="Nothing yet" description="Project and task activity will show up here as it happens." />
          </div>
        ) : (
          <ul className="scroll-hover flex max-h-[380px] flex-col overflow-y-auto pr-1">
            {logs.map((log) => {
              const meta = describe(log);
              const Icon = meta.icon;
              return (
                <li key={log.id}>
                  <div className="group flex items-start gap-3 rounded-xl p-3 transition-colors duration-150 hover:bg-paper">
                    <div className="relative shrink-0">
                      <Avatar name={log.actor?.name} src={log.actor?.avatarUrl} size="sm" />
                      <span
                        className={clsx(
                          'absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white ring-2 ring-surface',
                          TONE_DOT[meta.tone]
                        )}
                      >
                        <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-soft">
                        <span className="font-medium text-ink">{log.actor?.name ?? 'Someone'}</span> {meta.label}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-muted">
                        {log.Project?.id && (
                          <>
                            <Link
                              to={`${basePath}/${log.Project.id}`}
                              className="truncate font-medium text-route-600 transition-colors hover:text-route-700 hover:underline"
                            >
                              {log.Project.name}
                            </Link>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span className="shrink-0">{formatRelativeTime(log.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
