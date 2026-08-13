import { useCallback, useRef, useState } from 'react';
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useAuth } from '../hooks/useAuth';

// Mirrors the `handle={{ title }}` values on each <Route> in App.jsx.
// useMatches() would normally read those directly, but that hook only
// works with React Router's data router (createBrowserRouter), and this
// app uses plain <BrowserRouter>/<Routes> — so we match on path instead.
const TITLE_ROUTES = [
  ['/admin', 'Dashboard'],
  ['/admin/timeline', 'Timeline'],
  ['/admin/projects', 'Projects'],
  ['/admin/projects/:id', 'Project'],
  ['/admin/tasks/:id', 'Task'],
  ['/admin/team', 'Team workload'],
  ['/admin/meetings', 'Meetings'],
  ['/admin/time-tracking', 'Time Tracking'],
  ['/admin/reports', 'Reports'],
  ['/admin/reports/team', 'Reports'],
  ['/admin/users', 'Users'],
  ['/admin/notifications', 'Notifications'],
  ['/admin/profile', 'Profile'],
  ['/admin/settings', 'Settings'],
  ['/pm', 'Dashboard'],
  ['/pm/timeline', 'Timeline'],
  ['/pm/projects', 'My Projects'],
  ['/pm/projects/:id', 'Project'],
  ['/pm/tasks', 'Tasks'],
  ['/pm/tasks/:id', 'Task'],
  ['/pm/members', 'My Team'],
  ['/pm/meetings', 'Meetings'],
  ['/pm/time-tracking', 'Time Tracking'],
  ['/pm/reports/team', 'Member Reports'],
  ['/pm/notifications', 'Notifications'],
  ['/pm/profile', 'Profile'],
  ['/pm/settings', 'Settings'],
  ['/team', 'Dashboard'],
  ['/team/projects', 'My Projects'],
  ['/team/projects/:id', 'Project'],
  ['/team/tasks', 'My Tasks'],
  ['/team/tasks/:id', 'Task'],
  ['/team/meetings', 'Meetings'],
  ['/team/time-tracking', 'Time Tracking'],
  ['/team/notifications', 'Notifications'],
  ['/team/profile', 'Profile'],
  ['/team/settings', 'Settings'],
];

function useRouteTitle() {
  const location = useLocation();
  const match = TITLE_ROUTES.find(([pattern]) => matchPath({ path: pattern, end: true }, location.pathname));
  return match?.[1] ?? 'Waypoint';
}

// Shared shell for all three portals. Below the lg breakpoint the sidebar
// collapses into an off-canvas drawer (see Sidebar.jsx) — this component
// just owns the open/closed bit so Topbar's hamburger and Sidebar's own
// scrim/close button can both drive it.
export default function PortalLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const title = useRouteTitle();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Drives a scroll-aware shadow on the topbar — flat while the page is
  // pinned at the top, lifting to sit visibly above content once the user
  // has scrolled, so the header always reads as "above" what's under it
  // instead of blending into it on long pages.
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const handleMainScroll = useCallback((e) => {
    const isScrolled = e.currentTarget.scrollTop > 4;
    if (isScrolled !== scrolledRef.current) {
      scrolledRef.current = isScrolled;
      setScrolled(isScrolled);
    }
  }, []);

  return (
    <div className="flex h-screen bg-paper">
      <Sidebar role={user.role} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onOpenMenu={() => setMobileNavOpen(true)} scrolled={scrolled} />
        <main
          onScroll={handleMainScroll}
          className="flex-1 overflow-y-auto scroll-smooth px-4 py-5 sm:px-6 sm:py-6"
        >
          {/* Re-keying on pathname remounts this wrapper on every navigation
              — sidebar link, topbar search, breadcrumb, anything — so each
              new page fades + lifts in instead of just snapping into place.
              Reuses the same fade-in-up timing as the rest of the app. */}
          <div key={location.pathname} className="animate-[fade-in-up_0.3s_ease-out_both]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
