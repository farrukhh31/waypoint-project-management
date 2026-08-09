import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-paper text-center">
      <Compass className="h-8 w-8 text-route-500" />
      <h1 className="font-display text-2xl font-semibold text-ink">Off the route</h1>
      <p className="max-w-xs text-sm text-ink-muted">
        This page doesn't exist, or you don't have access to it.
      </p>
      <Link to="/">
        <Button size="sm" className="mt-2">
          Back to safety
        </Button>
      </Link>
    </div>
  );
}
