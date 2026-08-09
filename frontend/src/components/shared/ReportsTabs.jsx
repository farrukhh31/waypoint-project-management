import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

// Tab switcher sitting inside the Reports page so the per-member drill-down
// reads as part of Reports rather than a disconnected sidebar entry.
export default function ReportsTabs({ basePath }) {
  const tabs = [
    { label: 'Overview', to: basePath, end: true },
    { label: 'Team', to: `${basePath}/team`, end: true },
  ];

  return (
    <div className="flex w-fit gap-1 rounded-full border border-line bg-surface p-1">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            clsx(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
              isActive ? 'bg-route-500 text-white shadow-sm' : 'text-ink-soft hover:bg-paper hover:text-ink'
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
