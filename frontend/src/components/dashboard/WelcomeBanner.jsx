import { FolderKanban, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';

const TODAY = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || name;
}

export default function WelcomeBanner({ name }) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{TODAY}</p>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink">
          Welcome back, {firstName(name)}
        </h2>
        <p className="mt-0.5 text-sm text-ink-muted">Here&apos;s where every project stands today.</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link to="/admin/users">
          <Button variant="secondary" size="md">
            <Users className="h-4 w-4" /> Users
          </Button>
        </Link>
        <Link to="/admin/projects">
          <Button variant="primary" size="md">
            <FolderKanban className="h-4 w-4" /> View projects
          </Button>
        </Link>
      </div>
    </Card>
  );
}
