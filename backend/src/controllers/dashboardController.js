const { Op } = require('sequelize');
const { Project, Task, User, ProjectMember, ActivityLog } = require('../models');
const catchAsync = require('../utils/catchAsync');

const inNextDays = (days) => {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);
  return { [Op.between]: [now, future] };
};

// project_created/project_updated -> "project", task_created/task_updated ->
// "task", everything member/discussion related -> "team". Mirrors the color
// grouping the dashboard's activity pill chart uses (route / accent / success).
function actionBucket(action) {
  if (action.startsWith('project_')) return 'project';
  if (action.startsWith('task_')) return 'task';
  return 'team';
}

// Last `numDays` calendar days (oldest first) of ActivityLog counts,
// bucketed by category, for the weekly activity pill chart and the
// Reports page's activity trend chart. Defaults to 7 to preserve the
// dashboard's existing behavior.
function buildActivityByDay(logs, numDays = 7) {
  const days = Array.from({ length: numDays }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (numDays - 1 - i));
    return d;
  });

  return days.map((day) => {
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const dayLogs = logs.filter((log) => {
      const t = new Date(log.createdAt);
      return t >= day && t < next;
    });
    const counts = { project: 0, task: 0, team: 0 };
    dayLogs.forEach((log) => {
      counts[actionBucket(log.action)] += 1;
    });
    return {
      date: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString(undefined, { weekday: 'short' }),
      total: dayLogs.length,
      ...counts,
    };
  });
}

// GET /api/dashboard — content adapts to req.user.role
const getDashboard = catchAsync(async (req, res) => {
  const { user } = req;

  if (user.role === 'ADMIN') {
    const [
      totalProjects,
      activeProjects,
      onHoldProjects,
      pendingApprovalProjects,
      totalUsers,
      totalTasks,
      completedTasks,
      overdueTasks,
      upcomingDeadlines,
    ] = await Promise.all([
      Project.count(),
      Project.count({ where: { status: 'ACTIVE' } }),
      Project.count({ where: { status: 'ON_HOLD' } }),
      Project.count({ where: { status: 'PENDING_APPROVAL' } }),
      User.count(),
      Task.count(),
      Task.count({ where: { status: 'COMPLETED' } }),
      Task.count({ where: { dueDate: { [Op.lt]: new Date() }, status: { [Op.ne]: 'COMPLETED' } } }),
      Task.findAll({
        where: { dueDate: inNextDays(7), status: { [Op.ne]: 'COMPLETED' } },
        include: [
          { model: Project, as: 'project', attributes: ['id', 'name'] },
          { model: User, as: 'assignee', attributes: ['id', 'name', 'avatarUrl'] },
        ],
        order: [['dueDate', 'ASC']],
        limit: 10,
      }),
    ]);

    const [projectsByStatus, tasksByStatus, timeline, recentActivity, weekActivityLogs] = await Promise.all([
      Project.findAll({
        attributes: ['status', [Project.sequelize.fn('COUNT', Project.sequelize.col('id')), 'count']],
        group: ['status'],
      }),
      Task.findAll({
        attributes: ['status', [Task.sequelize.fn('COUNT', Task.sequelize.col('id')), 'count']],
        group: ['status'],
      }),
      // Active projects with a date range, for a lightweight timeline/gantt widget.
      Project.findAll({
        where: { status: 'ACTIVE' },
        attributes: ['id', 'name', 'startDate', 'endDate', 'priority', 'status'],
        include: [{ model: User, as: 'manager', attributes: ['id', 'name', 'avatarUrl'] }],
        order: [['startDate', 'ASC']],
        limit: 8,
      }),
      // Latest activity across every project, for an admin-wide activity feed.
      ActivityLog.findAll({
        include: [
          { model: User, as: 'actor', attributes: ['id', 'name', 'avatarUrl'] },
          { model: Project, attributes: ['id', 'name'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 8,
      }),
      // Raw last-7-days logs for the weekly activity pill chart (grouped in JS below).
      ActivityLog.findAll({
        where: { createdAt: { [Op.gte]: (() => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - 6);
          return d;
        })() } },
        attributes: ['action', 'createdAt'],
      }),
    ]);

    const activityByDay = buildActivityByDay(weekActivityLogs);

    return res.json({
      success: true,
      data: {
        role: 'ADMIN',
        stats: {
          totalProjects,
          activeProjects,
          onHoldProjects,
          pendingApprovalProjects,
          totalUsers,
          totalTasks,
          completedTasks,
          overdueTasks,
        },
        projectsByStatus,
        tasksByStatus,
        timeline,
        recentActivity,
        activityByDay,
        upcomingDeadlines,
      },
    });
  }

  if (user.role === 'PROJECT_MANAGER') {
    const managedProjects = await Project.findAll({ where: { managerId: user.id } });
    const projectIds = managedProjects.map((p) => p.id);

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      tasksAwaitingReview,
      overdueTasks,
      upcomingDeadlines,
    ] = await Promise.all([
      Task.count({ where: { projectId: { [Op.in]: projectIds } } }),
      Task.count({ where: { projectId: { [Op.in]: projectIds }, status: 'COMPLETED' } }),
      Task.count({ where: { projectId: { [Op.in]: projectIds }, status: { [Op.ne]: 'COMPLETED' } } }),
      Task.count({ where: { projectId: { [Op.in]: projectIds }, status: 'REVIEW' } }),
      Task.count({
        where: { projectId: { [Op.in]: projectIds }, dueDate: { [Op.lt]: new Date() }, status: { [Op.ne]: 'COMPLETED' } },
      }),
      Task.findAll({
        where: { projectId: { [Op.in]: projectIds }, dueDate: inNextDays(7), status: { [Op.ne]: 'COMPLETED' } },
        include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
        order: [['dueDate', 'ASC']],
        limit: 10,
      }),
    ]);

    // Counted in JS off the projects we already fetched — cheaper than a
    // second grouped query, and mirrors the shape of the admin donut
    // (StatusBreakdown expects [{ status, count }] rows).
    const projectStatusCounts = managedProjects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    const projectsByStatus = Object.entries(projectStatusCounts).map(([status, count]) => ({ status, count }));

    const [tasksByStatus, timeline, recentActivity, weekActivityLogs] = await Promise.all([
      Task.findAll({
        where: { projectId: { [Op.in]: projectIds } },
        attributes: ['status', [Task.sequelize.fn('COUNT', Task.sequelize.col('id')), 'count']],
        group: ['status'],
      }),
      // This PM's own active projects, for the dashboard's timeline preview.
      Project.findAll({
        where: { managerId: user.id, status: 'ACTIVE' },
        attributes: ['id', 'name', 'startDate', 'endDate', 'priority', 'status'],
        include: [{ model: User, as: 'manager', attributes: ['id', 'name', 'avatarUrl'] }],
        order: [['startDate', 'ASC']],
        limit: 8,
      }),
      // Activity across this PM's projects only, not the whole org.
      ActivityLog.findAll({
        where: { projectId: { [Op.in]: projectIds } },
        include: [
          { model: User, as: 'actor', attributes: ['id', 'name', 'avatarUrl'] },
          { model: Project, attributes: ['id', 'name'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 8,
      }),
      ActivityLog.findAll({
        where: {
          projectId: { [Op.in]: projectIds },
          createdAt: { [Op.gte]: (() => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - 6);
            return d;
          })() },
        },
        attributes: ['action', 'createdAt'],
      }),
    ]);

    const activityByDay = buildActivityByDay(weekActivityLogs);

    return res.json({
      success: true,
      data: {
        role: 'PROJECT_MANAGER',
        stats: {
          assignedProjects: managedProjects.length,
          activeProjects: projectStatusCounts.ACTIVE || 0,
          onHoldProjects: projectStatusCounts.ON_HOLD || 0,
          pendingApprovalProjects: projectStatusCounts.PENDING_APPROVAL || 0,
          totalTasks,
          completedTasks,
          pendingTasks,
          tasksAwaitingReview,
          overdueTasks,
        },
        projectsByStatus,
        tasksByStatus,
        timeline,
        recentActivity,
        activityByDay,
        upcomingDeadlines,
      },
    });
  }

  // TEAM_MEMBER — everything below is scoped to this member's own
  // memberships/assignments, never another member's data. Mirrors the
  // PM branch's shape (stats/projectsByStatus/tasksByStatus/timeline/
  // recentActivity/activityByDay) so the dashboard UI can share one
  // sectioned layout across all three roles instead of a stripped-down
  // one-off for team members.
  const memberships = await ProjectMember.findAll({ where: { userId: user.id } });
  const projectIds = memberships.map((m) => m.projectId);

  const [
    myProjects,
    assignedTasksTotal,
    completedTasks,
    pendingTasks,
    tasksAwaitingReview,
    overdueTasks,
    upcomingDeadlines,
  ] = await Promise.all([
    Project.findAll({ where: { id: { [Op.in]: projectIds } }, attributes: ['id', 'status'] }),
    Task.count({ where: { assigneeId: user.id } }),
    Task.count({ where: { assigneeId: user.id, status: 'COMPLETED' } }),
    Task.count({ where: { assigneeId: user.id, status: { [Op.ne]: 'COMPLETED' } } }),
    Task.count({ where: { assigneeId: user.id, status: 'REVIEW' } }),
    Task.count({ where: { assigneeId: user.id, dueDate: { [Op.lt]: new Date() }, status: { [Op.ne]: 'COMPLETED' } } }),
    Task.findAll({
      where: { assigneeId: user.id, dueDate: inNextDays(7), status: { [Op.ne]: 'COMPLETED' } },
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
      order: [['dueDate', 'ASC']],
      limit: 10,
    }),
  ]);

  // Counted in JS off the projects already fetched, same approach the
  // PM branch uses — cheaper than a second grouped query for a handful
  // of rows, and matches the [{ status, count }] shape StatusBreakdown expects.
  const projectStatusCounts = myProjects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const projectsByStatus = Object.entries(projectStatusCounts).map(([status, count]) => ({ status, count }));

  const [tasksByStatus, timeline, recentActivity, weekActivityLogs] = await Promise.all([
    Task.findAll({
      where: { assigneeId: user.id },
      attributes: ['status', [Task.sequelize.fn('COUNT', Task.sequelize.col('id')), 'count']],
      group: ['status'],
    }),
    // This member's own active projects, for the dashboard's timeline preview.
    Project.findAll({
      where: { id: { [Op.in]: projectIds }, status: 'ACTIVE' },
      attributes: ['id', 'name', 'startDate', 'endDate', 'priority', 'status'],
      include: [{ model: User, as: 'manager', attributes: ['id', 'name', 'avatarUrl'] }],
      order: [['startDate', 'ASC']],
      limit: 8,
    }),
    // Activity across the projects this member sits on, not the whole org.
    ActivityLog.findAll({
      where: { projectId: { [Op.in]: projectIds } },
      include: [
        { model: User, as: 'actor', attributes: ['id', 'name', 'avatarUrl'] },
        { model: Project, attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 8,
    }),
    ActivityLog.findAll({
      where: {
        projectId: { [Op.in]: projectIds },
        createdAt: { [Op.gte]: (() => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - 6);
          return d;
        })() },
      },
      attributes: ['action', 'createdAt'],
    }),
  ]);

  const activityByDay = buildActivityByDay(weekActivityLogs);

  res.json({
    success: true,
    data: {
      role: 'TEAM_MEMBER',
      stats: {
        assignedProjects: projectIds.length,
        activeProjects: projectStatusCounts.ACTIVE || 0,
        assignedTasks: assignedTasksTotal,
        totalTasks: assignedTasksTotal,
        completedTasks,
        pendingTasks,
        tasksAwaitingReview,
        overdueTasks,
      },
      projectsByStatus,
      tasksByStatus,
      timeline,
      recentActivity,
      activityByDay,
      upcomingDeadlines,
    },
  });
});

const ALLOWED_RANGES = [7, 14, 30];

// GET /api/dashboard/activity?days=7|14|30 — real, queried-on-demand
// activity trend for the Reports page's chart. Same ActivityLog source and
// project/task/team bucketing as the main dashboard's 7-day pill chart,
// just parameterized so the chart can offer a real range toggle instead of
// a fixed week. Admin-only (org-wide, unscoped by project) — mirrors what
// the Reports page already shows.
const getActivityTrend = catchAsync(async (req, res) => {
  const requested = parseInt(req.query.days, 10);
  const numDays = ALLOWED_RANGES.includes(requested) ? requested : 7;

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (numDays - 1));

  const logs = await ActivityLog.findAll({
    where: { createdAt: { [Op.gte]: since } },
    attributes: ['action', 'createdAt'],
  });

  const activityByDay = buildActivityByDay(logs, numDays);
  const totals = activityByDay.reduce(
    (acc, day) => ({
      project: acc.project + day.project,
      task: acc.task + day.task,
      team: acc.team + day.team,
      total: acc.total + day.total,
    }),
    { project: 0, task: 0, team: 0, total: 0 }
  );

  res.json({ success: true, data: { days: numDays, activityByDay, totals } });
});

module.exports = { getDashboard, getActivityTrend };
