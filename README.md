<div align="center">

# 🧭 Waypoint

### Project Management & Team Collaboration Platform

A full-stack platform for managing projects, tasks, meetings, and teams — with real-time updates, time tracking, and role-based access control.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Sequelize-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ✨ Overview

Waypoint brings project tracking, team scheduling, and communication into one platform. It's built as a decoupled React SPA talking to an Express REST API, with WebSockets powering live notifications and activity updates.

## 🚀 Features

| | |
|---|---|
| 🔐 **Auth & RBAC** | JWT access/refresh tokens, role-based access control, optional two-factor authentication |
| 📁 **Projects & Tasks** | Full project/task lifecycle, task dependencies, threaded discussions |
| 📅 **Meetings** | Scheduling, attendees, and RSVP tracking |
| ⏱️ **Time Tracking** | Time entries and reporting per user/project |
| 🔔 **Real-Time Notifications** | Live updates and activity feed via Socket.IO |
| ✉️ **Team Invites** | Email-based invite flow via Nodemailer |
| 🖼️ **File Uploads** | Avatars and attachments via Cloudinary |
| 📊 **Dashboards** | At-a-glance views of activity and progress |

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Frontend**
- ⚛️ React 18 + Vite
- 🧭 React Router
- 🎨 Tailwind CSS
- 📡 Axios
- 🔌 Socket.IO Client

</td>
<td valign="top" width="50%">

**Backend**
- 🟢 Node.js + Express
- 🐘 Sequelize ORM (PostgreSQL / SQLite)
- 🔌 Socket.IO
- 🔑 JWT Authentication
- ✅ Zod Validation
- ☁️ Cloudinary
- 📧 Nodemailer

</td>
</tr>
</table>

## 📂 Project Structure

```
waypoint/
├── frontend/          # React + Vite single-page app
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── context/
│       └── lib/
└── backend/            # Express REST API
    └── src/
        ├── controllers/
        ├── models/
        ├── routes/
        ├── services/
        ├── middleware/
        └── migrations/
```

## ⚡ Getting Started

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL (production) or SQLite (local dev)

### 1️⃣ Clone & Install

```bash
git clone https://github.com/<your-org>/waypoint.git
cd waypoint
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
cp .env.example .env    # fill in the values below
npm run db:migrate
npm run seed             # optional: seed sample data
npm run dev
```

<details>
<summary><strong>🔧 Backend environment variables</strong></summary>

<br>

| Variable | Description |
|---|---|
| `PORT` | Port the API listens on |
| `NODE_ENV` | `development`, `production`, etc. |
| `DB_DIALECT` | `postgres` or `sqlite` |
| `DATABASE_URL` | Database connection string |
| `DB_SSL` | Whether to require SSL for the DB connection |
| `JWT_ACCESS_SECRET` | Signing secret for access tokens (16+ chars) |
| `JWT_REFRESH_SECRET` | Signing secret for refresh tokens (16+ chars) |
| `JWT_ACCESS_EXPIRES` | Access token lifetime |
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime |
| `CLIENT_URL` | Frontend URL, used for CORS |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Credentials for outbound email |
| `MAIL_FROM_NAME` | Display name for outbound email |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials for uploads |

> ⚠️ In production, the server refuses to start on SQLite or with the sample dev JWT secrets — set real values before deploying.

</details>

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:5173` by default, talking to the API configured in `frontend/src/lib/api.js`.

## 📜 Available Scripts

<table>
<tr>
<td valign="top" width="50%">

**Backend**
```bash
npm run dev                  # start with nodemon
npm start                    # start server
npm run db:migrate           # run migrations
npm run db:migrate:undo      # roll back last migration
npm run db:migrate:undo:all  # roll back all migrations
npm run seed                 # seed sample data
```

</td>
<td valign="top" width="50%">

**Frontend**
```bash
npm run dev       # start dev server
npm run build     # production build
npm run preview   # preview build
npm run lint      # run ESLint
```

</td>
</tr>
</table>

## 🗺️ API Overview

| Route | Description |
|---|---|
| `/api/auth` | Login, register, token refresh |
| `/api/users` | User management |
| `/api/projects` | Projects & discussions |
| `/api/tasks` | Tasks & discussions |
| `/api/meetings` | Meetings & attendees |
| `/api/time-entries` | Time tracking |
| `/api/notifications` | Notifications |
| `/api/activity` | Activity feed |
| `/api/invites` | Team invites |
| `/api/uploads` | File uploads |

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open a pull request or file an issue.

## 📄 License

Licensed under the [MIT License](LICENSE).

---
