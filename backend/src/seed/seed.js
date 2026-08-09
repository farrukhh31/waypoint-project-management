require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Project, ProjectMember, Task, TaskDiscussion, TimeEntry, Meeting, TaskDependency, ActivityLog, Notification } = require('../models');
const { randomAvatarUrl } = require('../utils/avatar');

async function seed() {
  // Schema now lives in migrations (npm run db:migrate), not sync(). This only clears
  // existing rows — run `npm run db:migrate` first if the tables don't exist yet.
  console.log('Clearing existing data...');
  if (sequelize.getDialect() === 'postgres') {
    await sequelize.query(
      'TRUNCATE TABLE activity_logs, task_discussions, notifications, refresh_tokens, invites, time_entries, meetings, task_dependencies, tasks, project_members, projects, users RESTART IDENTITY CASCADE;'
    );
  } else {
    // SQLite has no TRUNCATE; delete in FK-safe (child-first) order instead.
    const { ActivityLog, TaskDiscussion, Notification, RefreshToken, Invite, Task, ProjectMember, Project } = require('../models');
    for (const Model of [ActivityLog, TaskDiscussion, Notification, RefreshToken, Invite, TimeEntry, Meeting, TaskDependency, Task, ProjectMember, Project, User]) {
      await Model.destroy({ where: {}, truncate: true, force: true });
    }
  }
  console.log('Seeding demo data...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await User.create({
    name: 'Ayesha Khan',
    email: 'admin@pmplatform.dev',
    passwordHash,
    role: 'ADMIN',
    jobTitle: 'System Administrator',
    avatarUrl: randomAvatarUrl('admin@pmplatform.dev'),
  });

  const pm1 = await User.create({
    name: 'Bilal Ahmed',
    email: 'pm1@pmplatform.dev',
    passwordHash,
    role: 'PROJECT_MANAGER',
    jobTitle: 'Senior Project Manager',
    avatarUrl: randomAvatarUrl('pm1@pmplatform.dev'),
  });

  const pm2 = await User.create({
    name: 'Sara Malik',
    email: 'pm2@pmplatform.dev',
    passwordHash,
    role: 'PROJECT_MANAGER',
    jobTitle: 'Project Manager',
    avatarUrl: randomAvatarUrl('pm2@pmplatform.dev'),
  });

  const members = await Promise.all(
    [
      ['Hamza Tariq', 'hamza@pmplatform.dev', 'Frontend Developer'],
      ['Fatima Noor', 'fatima@pmplatform.dev', 'Backend Developer'],
      ['Usman Sheikh', 'usman@pmplatform.dev', 'QA Engineer'],
      ['Zainab Iqbal', 'zainab@pmplatform.dev', 'UI/UX Designer'],
    ].map(([name, email, jobTitle]) =>
      User.create({ name, email, passwordHash, role: 'TEAM_MEMBER', jobTitle, avatarUrl: randomAvatarUrl(email) })
    )
  );

  const [hamza, fatima, usman, zainab] = members;

  // ---------------- Project 1 ----------------
  const project1 = await Project.create({
    name: 'Client Portal Revamp',
    description:
      'Redesign and rebuild the client-facing portal with a modern UI, faster load times, and self-service account management.',
    startDate: new Date(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    priority: 'HIGH',
    status: 'ACTIVE',
    managerId: pm1.id,
  });
  await ProjectMember.bulkCreate([
    { projectId: project1.id, userId: hamza.id },
    { projectId: project1.id, userId: fatima.id },
    { projectId: project1.id, userId: zainab.id },
  ]);

  const t1 = await Task.create({
    title: 'Design new dashboard wireframes',
    description: 'Create low and high fidelity wireframes for the redesigned client dashboard.',
    projectId: project1.id,
    assigneeId: zainab.id,
    creatorId: pm1.id,
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    progress: 60,
  });
  const t2 = await Task.create({
    title: 'Implement authentication flow',
    description: 'Build login, registration, and password reset screens against the new API.',
    projectId: project1.id,
    assigneeId: hamza.id,
    creatorId: pm1.id,
    priority: 'URGENT',
    status: 'TODO',
    startDate: new Date(),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // due soon, to test deadline notifications
    progress: 10,
  });
  const t3 = await Task.create({
    title: 'Set up REST API for account settings',
    description: 'Expose endpoints for updating profile, billing info, and notification preferences.',
    projectId: project1.id,
    assigneeId: fatima.id,
    creatorId: pm1.id,
    priority: 'MEDIUM',
    status: 'REVIEW',
    startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    progress: 85,
  });
  const t4 = await Task.create({
    title: 'Client demo & sign-off',
    description: 'Walk the client through the finished portal and get sign-off to launch.',
    projectId: project1.id,
    assigneeId: pm1.id,
    creatorId: pm1.id,
    priority: 'HIGH',
    status: 'TODO',
    startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    isMilestone: true,
  });

  // t4 (demo & sign-off) depends on both the auth flow and the account
  // settings API being done first — gives the Gantt view real connector
  // lines to draw out of the box.
  await TaskDependency.bulkCreate([
    { taskId: t4.id, dependsOnTaskId: t2.id },
    { taskId: t4.id, dependsOnTaskId: t3.id },
  ]);

  await TaskDiscussion.create({
    taskId: t1.id,
    userId: pm1.id,
    message: 'Please prioritize the mobile layout first since that\'s what the client demo will use.',
  });
  await TaskDiscussion.create({
    taskId: t1.id,
    userId: zainab.id,
    message: 'Sounds good — mobile wireframes will be ready by tomorrow.',
  });

  // ---------------- Project 2 ----------------
  const project2 = await Project.create({
    name: 'Internal Analytics Pipeline',
    description: 'Build an ETL pipeline and analytics dashboard for internal usage metrics.',
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    priority: 'MEDIUM',
    status: 'PLANNED',
    managerId: pm2.id,
  });
  await ProjectMember.bulkCreate([
    { projectId: project2.id, userId: usman.id },
    { projectId: project2.id, userId: fatima.id },
  ]);

  const t5 = await Task.create({
    title: 'Define data schema for events table',
    description: 'Decide on the schema for capturing raw usage events before transformation.',
    projectId: project2.id,
    assigneeId: fatima.id,
    creatorId: pm2.id,
    priority: 'MEDIUM',
    status: 'TODO',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  });
  const t6 = await Task.create({
    title: 'Write test plan for pipeline validation',
    description: 'Outline test cases to validate data integrity through each pipeline stage.',
    projectId: project2.id,
    assigneeId: usman.id,
    creatorId: pm2.id,
    priority: 'LOW',
    status: 'TODO',
    startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });

  // ---------------- Activity log history ----------------
  // Seven days of project/task/team events so the dashboard's weekly
  // activity chart and "Recent activity" feed aren't empty out of the box.
  // daysAgo: 6 = six days back, 0 = today.
  function activityAt(daysAgo, hour, minute, fields) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return { createdAt: d, updatedAt: d, metadata: null, ...fields };
  }

  await ActivityLog.bulkCreate(
    [
      // 6 days ago — Client Portal Revamp kicks off
      activityAt(6, 9, 15, { projectId: project1.id, userId: pm1.id, action: 'project_created' }),
      activityAt(6, 9, 42, { projectId: project1.id, userId: pm1.id, action: 'members_added' }),
      activityAt(6, 11, 5, { projectId: project1.id, taskId: t1.id, userId: pm1.id, action: 'task_created' }),
      activityAt(6, 14, 30, { projectId: project1.id, taskId: t2.id, userId: pm1.id, action: 'task_created' }),

      // 5 days ago
      activityAt(5, 10, 0, { projectId: project1.id, taskId: t3.id, userId: pm1.id, action: 'task_created' }),
      activityAt(5, 13, 20, { projectId: project1.id, taskId: t1.id, userId: zainab.id, action: 'task_updated' }),

      // 4 days ago — Internal Analytics Pipeline kicks off
      activityAt(4, 9, 50, { projectId: project2.id, userId: pm2.id, action: 'project_created' }),
      activityAt(4, 10, 5, { projectId: project2.id, userId: pm2.id, action: 'members_added' }),
      activityAt(4, 16, 10, { projectId: project1.id, taskId: t2.id, userId: hamza.id, action: 'task_updated' }),

      // 3 days ago
      activityAt(3, 9, 0, { projectId: project2.id, taskId: t5.id, userId: pm2.id, action: 'task_created' }),
      activityAt(3, 11, 45, { projectId: project2.id, taskId: t6.id, userId: pm2.id, action: 'task_created' }),
      activityAt(3, 15, 30, { projectId: project1.id, taskId: t3.id, userId: fatima.id, action: 'task_updated' }),

      // 2 days ago
      activityAt(2, 10, 15, { projectId: project1.id, taskId: t1.id, userId: pm1.id, action: 'discussion_added' }),
      activityAt(2, 10, 40, { projectId: project1.id, taskId: t1.id, userId: zainab.id, action: 'discussion_added' }),
      activityAt(2, 17, 0, { projectId: project1.id, taskId: t4.id, userId: pm1.id, action: 'task_created' }),

      // yesterday
      activityAt(1, 9, 30, { projectId: project1.id, taskId: t3.id, userId: fatima.id, action: 'task_updated' }),
      activityAt(1, 12, 0, { projectId: project1.id, userId: pm1.id, action: 'project_updated' }),
      activityAt(1, 14, 45, { projectId: project2.id, taskId: t6.id, userId: usman.id, action: 'task_updated' }),

      // today
      activityAt(0, 8, 40, { projectId: project1.id, taskId: t2.id, userId: hamza.id, action: 'task_updated' }),
      activityAt(0, 9, 5, { projectId: project1.id, taskId: t1.id, userId: zainab.id, action: 'task_updated' }),
      activityAt(0, 11, 30, { projectId: project2.id, taskId: t5.id, userId: fatima.id, action: 'task_updated' }),
    ],
    { validate: true }
  );

  // ---------------- Notifications ----------------
  // One notification row per real event above (assignment, project add,
  // status change, discussion reply, deadline reminder) so every demo
  // account's Notifications page — and the bell — has real, varied,
  // mostly-read-with-some-unread data on first login instead of being
  // empty. Types are constrained to the Notification model's ENUM
  // (TASK_ASSIGNED, TASK_STATUS_CHANGED, DISCUSSION_ADDED,
  // DEADLINE_APPROACHING, PROJECT_ASSIGNED, MEMBER_ADDED) — there's no
  // "submitted for review" type in the app, so t3's move into REVIEW is
  // seeded as a TASK_STATUS_CHANGED, exactly like updateStatus emits it.
  function notifAt(daysAgo, hour, minute, fields) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return { createdAt: d, updatedAt: d, isRead: false, link: null, ...fields };
  }

  await Notification.bulkCreate(
    [
      // Project assignments — mirrors createProject notifying the manager + every seeded member
      notifAt(6, 9, 15, {
        userId: pm1.id,
        type: 'PROJECT_ASSIGNED',
        message: `You've been added to the project "${project1.name}".`,
        link: `/projects/${project1.id}`,
        isRead: true,
      }),
      notifAt(6, 9, 20, {
        userId: hamza.id,
        type: 'PROJECT_ASSIGNED',
        message: `You've been added to the project "${project1.name}".`,
        link: `/projects/${project1.id}`,
        isRead: true,
      }),
      notifAt(6, 9, 22, {
        userId: fatima.id,
        type: 'PROJECT_ASSIGNED',
        message: `You've been added to the project "${project1.name}".`,
        link: `/projects/${project1.id}`,
        isRead: true,
      }),
      notifAt(6, 9, 24, {
        userId: zainab.id,
        type: 'PROJECT_ASSIGNED',
        message: `You've been added to the project "${project1.name}".`,
        link: `/projects/${project1.id}`,
        isRead: true,
      }),
      notifAt(4, 9, 52, {
        userId: pm2.id,
        type: 'PROJECT_ASSIGNED',
        message: `You've been added to the project "${project2.name}".`,
        link: `/projects/${project2.id}`,
        isRead: true,
      }),
      notifAt(4, 10, 7, {
        userId: usman.id,
        type: 'PROJECT_ASSIGNED',
        message: `You've been added to the project "${project2.name}".`,
        link: `/projects/${project2.id}`,
        isRead: true,
      }),
      notifAt(4, 10, 9, {
        userId: fatima.id,
        type: 'PROJECT_ASSIGNED',
        message: `You've been added to the project "${project2.name}".`,
        link: `/projects/${project2.id}`,
        isRead: false,
      }),

      // Task assignments — mirrors createTask notifying the assignee
      notifAt(6, 11, 10, {
        userId: zainab.id,
        type: 'TASK_ASSIGNED',
        message: `You've been assigned a new task: "${t1.title}".`,
        link: `/tasks/${t1.id}`,
        isRead: true,
      }),
      notifAt(6, 14, 35, {
        userId: hamza.id,
        type: 'TASK_ASSIGNED',
        message: `You've been assigned a new task: "${t2.title}".`,
        link: `/tasks/${t2.id}`,
        isRead: true,
      }),
      notifAt(5, 10, 5, {
        userId: fatima.id,
        type: 'TASK_ASSIGNED',
        message: `You've been assigned a new task: "${t3.title}".`,
        link: `/tasks/${t3.id}`,
        isRead: true,
      }),
      notifAt(3, 11, 50, {
        userId: usman.id,
        type: 'TASK_ASSIGNED',
        message: `You've been assigned a new task: "${t6.title}".`,
        link: `/tasks/${t6.id}`,
        isRead: false,
      }),

      // Status changes — mirrors updateStatus notifying the owning PM.
      // t3 is seeded straight into REVIEW, so this doubles as the
      // "submitted for review" signal — the app has no separate type for that.
      notifAt(5, 13, 25, {
        userId: pm1.id,
        type: 'TASK_STATUS_CHANGED',
        message: `Task "${t1.title}" status changed to IN PROGRESS.`,
        link: `/tasks/${t1.id}`,
        isRead: true,
      }),
      notifAt(1, 14, 50, {
        userId: pm2.id,
        type: 'TASK_STATUS_CHANGED',
        message: `Task "${t6.title}" status changed to IN PROGRESS.`,
        link: `/tasks/${t6.id}`,
        isRead: false,
      }),
      notifAt(1, 9, 35, {
        userId: pm1.id,
        type: 'TASK_STATUS_CHANGED',
        message: `Task "${t3.title}" status changed to REVIEW.`,
        link: `/tasks/${t3.id}`,
        isRead: false,
      }),

      // Discussion replies — mirrors discussionController notifying the other participant
      notifAt(2, 10, 16, {
        userId: zainab.id,
        type: 'DISCUSSION_ADDED',
        message: `New comment on "${t1.title}".`,
        link: `/tasks/${t1.id}`,
        isRead: true,
      }),
      notifAt(2, 10, 41, {
        userId: pm1.id,
        type: 'DISCUSSION_ADDED',
        message: `New comment on "${t1.title}".`,
        link: `/tasks/${t1.id}`,
        isRead: true,
      }),

      // Deadline reminder — t2 is due tomorrow, sent to both the assignee and the owning PM
      notifAt(0, 8, 0, {
        userId: hamza.id,
        type: 'DEADLINE_APPROACHING',
        message: `"${t2.title}" is due tomorrow.`,
        link: `/tasks/${t2.id}`,
        isRead: false,
      }),
      notifAt(0, 8, 0, {
        userId: pm1.id,
        type: 'DEADLINE_APPROACHING',
        message: `"${t2.title}" is due tomorrow.`,
        link: `/tasks/${t2.id}`,
        isRead: false,
      }),
    ],
    { validate: true }
  );

  // A running timer + a few of today's meetings for the admin account, so
  // the Time tracking / Today's meetings dashboard widgets have something
  // to show immediately after seeding.
  const now = new Date();
  const startedAt = new Date(now.getTime() - 45 * 60 * 1000); // started 45 min ago
  await TimeEntry.create({
    label: 'UX Research',
    userId: admin.id,
    projectId: project1.id,
    status: 'RUNNING',
    startedAt,
    lastResumedAt: startedAt,
    accumulatedSeconds: 0,
  });

  const today = new Date(now);
  function todayAt(hours, minutes) {
    const d = new Date(today);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }
  await Meeting.bulkCreate([
    { userId: admin.id, title: 'Daily standup', startTime: todayAt(8, 30), endTime: todayAt(8, 45), reminderEnabled: true },
    { userId: admin.id, title: 'XR Health sync', startTime: todayAt(10, 30), endTime: todayAt(11, 0), reminderEnabled: true },
    { userId: admin.id, title: 'Team meeting', startTime: todayAt(16, 30), endTime: todayAt(17, 0), reminderEnabled: false },
  ]);

  console.log('\nSeed complete! Demo accounts (all use password: Password123!):');
  console.log('  Admin:           admin@pmplatform.dev');
  console.log('  Project Manager: pm1@pmplatform.dev  (manages Client Portal Revamp)');
  console.log('  Project Manager: pm2@pmplatform.dev  (manages Internal Analytics Pipeline)');
  console.log('  Team Member:     hamza@pmplatform.dev');
  console.log('  Team Member:     fatima@pmplatform.dev');
  console.log('  Team Member:     usman@pmplatform.dev');
  console.log('  Team Member:     zainab@pmplatform.dev');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});