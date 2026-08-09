# Waypoint — Frontend

React + Vite + Tailwind client for the Waypoint Project Management &
Team Collaboration Platform, scaffolded to match the `backend/` API
(Express + Sequelize, JWT auth with rotating refresh cookies, Socket.io).

## Status

This is the **general structure**, not a finished app: routing, auth flow,
layouts, the design system, and one working page per resource (list +
detail) are wired to the real API. Create/edit modals, drag-and-drop
status changes, real-time notification badges, and the activity timeline
are still to build.

## Stack

- React 18 + Vite
- Tailwind CSS (design tokens in `tailwind.config.js` / `src/index.css`)
- React Router v6 (role-scoped route trees, `handle: { title }` per route)
- Axios (`src/lib/api.js`) with silent refresh-token retry
- Socket.io client stub (`src/lib/socket.js`)

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api -> localhost:5000
```

Run the backend (`cd ../backend && npm run dev`) alongside this for the
proxy to have something to talk to. See the backend's own README for demo
account credentials.

## Structure

```
src/
  lib/          axios instance, socket client
  context/      AuthContext (session bootstrap, login/logout)
  hooks/        useAuth, useDashboard, useList (generic paginated fetch)
  routes/       ProtectedRoute (auth), RoleRoute (per-portal RBAC)
  layouts/      AuthLayout (login/register), PortalLayout (sidebar+topbar shell)
  components/
    ui/         Button, Card, Badge, Input, Avatar, EmptyState, StatusTracker...
    layout/     Sidebar, Topbar, NotificationBell
    shared/     PageHeader, Toolbar, ProjectCard, TaskRow, DeadlinesList
  config/       roles.js, statuses.js, navigation.js — mirror the backend's
                Sequelize ENUMs so the two never silently drift apart
  pages/
    auth/       Login, Register
    admin/      AdminDashboard, Users
    pm/         PMDashboard
    team/       TeamDashboard
    shared/     Projects, ProjectDetails, Tasks, TaskDetails, Notifications,
                Profile — reused across portals since the backend already
                scopes each request by role
```

## Design language

The product's premise is progress along a route: a task moves through
waypoints (To Do → In Progress → Review → Completed). That's the one
signature element (`components/ui/StatusTracker.jsx`, the `.route-line`
utility) — a dotted line with a pin marking the current stage. Everything
else stays quiet: a cool paper background, hairline borders, and the
amber accent reserved for that "current position" marker so it doesn't
dilute into a generic highlight color. Space Grotesk carries headings and
the wordmark; Inter is the UI/body face; JetBrains Mono is reserved for
anything data-like (not used much yet — natural fit for task IDs /
timestamps as those surfaces get built out).

## Next steps

- Create/edit forms for projects, tasks, and users (currently the
  "New project" / "New task" / "New user" buttons are structural only)
- Wire `NotificationBell` to `notification:new` socket events for a live
  unread badge instead of routing straight to the Notifications page
- Add/remove project member flow on `ProjectDetails`
- Pagination controls for list pages (the API already returns `pagination`
  via `useList`; the UI for it isn't built yet)
- Activity timeline (`GET /api/activity/project/:projectId`) on project details
