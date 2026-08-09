# Waypoint — Project Management Platform (Backend)

A role-based Project Management & Team Collaboration API: Admin, Project Manager, and Team Member
portals backed by one Express/Sequelize service.

## Stack
- Node.js + Express
- Sequelize ORM + **PostgreSQL** — schema managed by Sequelize CLI migrations (SQLite still works
  for zero-setup local dev; see below)
- JWT auth (access + rotating refresh tokens), bcrypt password hashing (cost factor 12)
- Zod request validation
- Socket.io for real-time notifications

> Note: this originally targeted Prisma, but Prisma's `prisma generate` downloads engine
> binaries from `binaries.prisma.sh`, which is blocked in network-restricted environments
> (including the sandbox this was built in, and many CI/deploy setups). Sequelize needs only
> ordinary npm packages, so it was used instead — functionally equivalent, same schema design.

## Setup (Postgres — recommended)

```bash
cd backend
npm install
cp .env.example .env        # fill in DATABASE_URL and generate real JWT secrets (see below)
npm run db:migrate           # creates all tables, foreign keys, indexes via migrations
npm run seed                 # wipes + seeds demo accounts + sample projects/tasks
npm run dev                  # starts on http://localhost:5000 (nodemon)
```

Generate real secrets instead of the placeholders in `.env.example`:
```bash
openssl rand -hex 32   # run twice — once for JWT_ACCESS_SECRET, once for JWT_REFRESH_SECRET
```
The server validates required env vars at boot (`src/config/validateEnv.js`) and refuses to
start if secrets are missing, too short, or (in `NODE_ENV=production`) still the sample dev
values — fails fast instead of running insecurely.

### Local dev without Postgres installed
Omit `DB_DIALECT` from `.env` entirely (or set it to anything other than `postgres`) to fall
back to a local SQLite file (`dev.db`) — no server to install. Everything else (migrations,
seed, routes) works the same either way; `src/config/database.js` branches on `DB_DIALECT`.

### Demo accounts (after `npm run seed`)
All use password `Password123!`

| Role | Email |
|---|---|
| Admin | admin@pmplatform.dev |
| Project Manager | pm1@pmplatform.dev |
| Project Manager | pm2@pmplatform.dev |
| Team Member | hamza@pmplatform.dev |
| Team Member | fatima@pmplatform.dev |
| Team Member | usman@pmplatform.dev |
| Team Member | zainab@pmplatform.dev |

## Database migrations
Schema is owned entirely by migrations in `src/migrations/` — not `sequelize.sync()`, which
skips foreign key constraints and keeps no history. Available commands:

```bash
npm run db:migrate              # apply all pending migrations
npm run db:migrate:status       # see what's applied / pending
npm run db:migrate:undo         # roll back the most recent migration
npm run db:migrate:undo:all     # roll back everything (careful — drops all tables)
```

To add a new table or column later, create a new file in `src/migrations/` (timestamp-prefixed,
after the existing ones) with `up`/`down` — see the existing files for the pattern — then run
`npm run db:migrate`. Keep the corresponding Sequelize model in `src/models/` in sync by hand;
the CLI doesn't generate models from migrations automatically here.

## Project structure
```
src/
  config/       DB connection (database.js), CLI config, env validation, security constants
  migrations/   Sequelize CLI migrations — source of truth for the schema
  models/       Sequelize models + associations (models/index.js)
  controllers/  Business logic per resource
  routes/       Express routers (RBAC applied here via middleware/rbac.js)
  middleware/   auth, rbac, validate, errorHandler
  validators/   Zod schemas per resource
  utils/        queryHelpers (safe sort/search/pagination), jwt, ApiError, catchAsync
  services/     notificationService, activityService, socketService, deadlineScheduler
  seed/         demo data seed script (truncates + reseeds; doesn't touch schema)
  app.js        Express app + route mounting
  server.js     boot: env validation, DB connect, HTTP server, Socket.io, scheduler
```

## Data model
`User` (ADMIN / PROJECT_MANAGER / TEAM_MEMBER) → `Project` (has one `manager`, many `members`
via `ProjectMember`) → `Task` (has one `assignee`, belongs to a `Project`) → `TaskDiscussion`
(comments per task). `Notification` and `ActivityLog` (activity timeline) are cross-cutting,
tied to users/projects/tasks as events occur. Every foreign key is enforced at the database
level (see the migrations), not just in application code.

## API surface

All routes except `/api/auth/register|login|refresh` require `Authorization: Bearer <accessToken>`.

- **Auth**: `POST /api/auth/register|login|refresh|logout`, `GET /api/auth/me`
- **Users** (admin-managed): `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/:id`,
  self-service `PATCH /api/users/me/profile`, `PATCH /api/users/me/password`,
  `GET /api/users/assignable` (dropdowns)
  — list supports `?search=&role=&isActive=&sortBy=&order=&page=&limit=`
- **Projects**: `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id`,
  `POST /api/projects/:id/members`, `DELETE /api/projects/:id/members/:userId`
  — list supports `?search=&status=&priority=&sortBy=&order=&page=&limit=`
- **Tasks**: `GET/POST /api/tasks`, `GET/PATCH/DELETE /api/tasks/:id`,
  `PATCH /api/tasks/:id/status`
  — list supports `?projectId=&status=&priority=&assigneeId=&search=&sortBy=&order=&page=&limit=`
- **Discussions**: `GET/POST /api/tasks/:id/discussions`
- **Notifications**: `GET /api/notifications`, `PATCH /api/notifications/:id/read`,
  `PATCH /api/notifications/read-all`
- **Dashboard**: `GET /api/dashboard` — response shape adapts to `req.user.role`
- **Activity timeline**: `GET /api/activity/project/:projectId`

All list endpoints return `{ success, data: { <items>, pagination: { page, limit, total, pages } } }`.
`sortBy` is checked against a per-resource whitelist (falls back to a safe default instead of
erroring or touching arbitrary columns), and `search` uses case-insensitive matching (`ILIKE` on
Postgres) rather than a case-sensitive `LIKE`.

## Role permissions (enforced server-side, not just hidden in UI)
- **Admin**: full access — manage users, create/assign/delete any project, reassign PMs, see everything.
- **Project Manager**: manage only projects they're assigned to — edit project info, add/remove
  members, create/edit/delete tasks, view all task discussions and activity in their projects.
- **Team Member**: view only projects/tasks they belong to, update the status of tasks assigned
  to them, post in task discussions, manage their own profile. Cannot create projects or tasks,
  cannot access admin/PM-only routes (enforced — verified with 403 tests, not just UI hiding).

## Security
- **Passwords**: bcrypt, cost factor 12 (configurable via `BCRYPT_SALT_ROUNDS`); registration,
  admin-created accounts, and password changes all require 8+ characters with a mix of upper/
  lowercase and a digit.
- **Emails**: normalized to lowercase at the validation layer before touching the database, so
  `Test@x.com` and `test@x.com` can't register as two separate accounts.
- **Auth tokens**: short-lived JWT access tokens (15m default) + rotating refresh tokens stored
  server-side (`refresh_tokens` table) in an `httpOnly`, `sameSite=lax` cookie scoped to
  `/api/auth` — a refresh token is invalidated and reissued on every use.
- **Rate limiting**: a general limiter across `/api` (500 req/15min) plus a much stricter one
  specifically on `/api/auth/login` and `/api/auth/register` (20 req/15min, only failed attempts
  count) so brute-forcing credentials is meaningfully slowed without throttling normal traffic
  from other users.
- **Injection safety**: all queries go through Sequelize's parameterized query builder. List
  endpoints additionally whitelist `sortBy` against known columns (`src/utils/queryHelpers.js`)
  rather than passing the raw query string into the `ORDER BY` clause.
- **Mass-assignment safety**: every write endpoint validates through a Zod schema that only
  allows specific fields — e.g. self-service profile updates can't set `role` or `isActive`
  even if included in the request body.
- **Standard hardening**: `helmet` (security headers), `cors` (locked to `CLIENT_URL`), `hpp`
  (strips duplicate query params), `compression`, request body size limit (2mb), `trust proxy`
  enabled in production for correct client IPs behind a load balancer.
- **Boot-time checks**: the server won't start without valid JWT secrets, and refuses to start
  in `NODE_ENV=production` with the sample dev secrets or on SQLite.

For a production deployment, also consider: a Redis-backed store for `express-rate-limit`
(the default in-memory store resets per-instance and doesn't share state across replicas),
structured logging in place of `morgan('dev')`, and moving `JWT_ACCESS_EXPIRES`/refresh
rotation policy to match your actual threat model.

## Real-time notifications
Socket.io authenticates via the same JWT access token (`socket.handshake.auth.token`) and joins
each user to a private `user:<id>` room. `notificationService.notifyUser()` creates the DB row
and emits `notification:new` to that room, so already-connected clients get instant updates
without polling. A REST-based unread badge (`GET /api/notifications`) still works for clients
without a socket connection.

## Deadline reminders
`services/deadlineScheduler.js` checks hourly for tasks due within 24h and not completed,
notifying the assignee once (deduped against notifications sent in the last 20h).

