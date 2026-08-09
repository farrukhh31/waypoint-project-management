import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../config/roles';

// Wraps a portal's routes (e.g. everything under /admin) so a Team Member
// who edits the URL by hand lands on their own dashboard instead of a
// blank page — the backend still enforces this on every request either way.
export default function RoleRoute({ allow }) {
  const { user } = useAuth();

  if (!allow.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  return <Outlet />;
}
