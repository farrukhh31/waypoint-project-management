import { Link } from 'react-router-dom';
import { PauseCircle, ClipboardCheck, AlertTriangle, Timer, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';

// "Needs attention" counts pulled from the same stats block the KPI row
// already has, just reframed as things to act on rather than things to
// admire — a quieter companion to the trend chart it sits beside. dueSoon
// is optional (only the Reports page, which already has the task list
// loaded, passes it) so this stays a drop-in for the plain dashboard too.
export default function HealthSnapshot({ onHold = 0, pendingApproval = 0, overdue = 0, dueSoon, basePath = '/admin/projects' }) {
  const rows = [
    {
      key: 'onHold',
      label: 'Projects on hold',
      value: onHold,
      icon: PauseCircle,
      tone: 'text-accent-600 bg-accent-100',
      to: `${basePath}?status=ON_HOLD`,
    },
    {
      key: 'pending',
      label: 'Awaiting approval',
      value: pendingApproval,
      icon: ClipboardCheck,
      tone: 'text-sky-600 bg-sky-100',
      to: `${basePath}?status=PENDING_APPROVAL`,
    },
    {
      key: 'overdue',
      label: 'Overdue tasks',
      value: overdue,
      icon: AlertTriangle,
      tone: 'text-danger-600 bg-danger-100',
      to: `${basePath}?overdue=true`,
    },
    ...(dueSoon != null
      ? [
          {
            key: 'dueSoon',
            label: 'Due within 3 days',
            value: dueSoon,
            icon: Timer,
            tone: 'text-route-600 bg-route-100',
            to: basePath,
          },
        ]
      : []),
  ];

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-pop">
      <CardHeader className="bg-gradient-to-r from-accent-400/10 via-surface to-surface">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Needs attention</h3>
          <p className="text-xs text-ink-muted">Quick pulse on risk</p>
        </div>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col gap-2.5">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <Link
              key={row.key}
              to={row.to}
              className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-route-200 hover:shadow-pop"
            >
              <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', row.tone)}>
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium text-ink-soft">{row.label}</span>
              <span className="font-display text-lg font-semibold text-ink">{row.value}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-route-600" />
            </Link>
          );
        })}
      </CardBody>
    </Card>
  );
}
