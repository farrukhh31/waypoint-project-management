import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMinDuration } from '../hooks/useMinDuration';
import FullScreenLoader from '../components/ui/FullScreenLoader.jsx';

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  const showLoader = useMinDuration(status === 'loading', 700);

  if (showLoader) return <FullScreenLoader />;

  if (status === 'guest') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
