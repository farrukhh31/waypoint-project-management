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

// Last 7 calendar days (oldest first) of ActivityLog counts, bucketed by
// category, for the weekly activity pill chart.
function buildActivityByDay(logs) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
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

    const [totalTasks, completedTasks, pendingTasks, tasksAwaitingReview, upcomingDeadlines] = await Promise.all([
      Task.count({ where: { projectId: { [Op.in]: projectIds } } }),
      Task.count({ where: { projectId: { [Op.in]: projectIds }, status: 'COMPLETED' } }),
      Task.count({ where: { projectId: { [Op.in]: projectIds }, status: { [Op.ne]: 'COMPLETED' } } }),
      Task.count({ where: { projectId: { [Op.in]: projectIds }, status: 'REVIEW' } }),
      Task.findAll({
        where: { projectId: { [Op.in]: projectIds }, dueDate: inNextDays(7), status: { [Op.ne]: 'COMPLETED' } },
        include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
        order: [['dueDate', 'ASC']],
        limit: 10,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        role: 'PROJECT_MANAGER',
        stats: {
          assignedProjects: managedProjects.length,
          totalTasks,
          completedTasks,
          pendingTasks,
          tasksAwaitingReview,
        },
        upcomingDeadlines,
      },
    });
  }

  // TEAM_MEMBER
  const memberships = await ProjectMember.findAll({ where: { userId: user.id } });
  const projectIds = memberships.map((m) => m.projectId);

  const [assignedTasksTotal, completedTasks, pendingTasks, tasksAwaitingReview, upcomingDeadlines] = await Promise.all([
    Task.count({ where: { assigneeId: user.id } }),
    Task.count({ where: { assigneeId: user.id, status: 'COMPLETED' } }),
    Task.count({ where: { assigneeId: user.id, status: { [Op.ne]: 'COMPLETED' } } }),
    Task.count({ where: { assigneeId: user.id, status: 'REVIEW' } }),
    Task.findAll({
      where: { assigneeId: user.id, dueDate: inNextDays(7), status: { [Op.ne]: 'COMPLETED' } },
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
      order: [['dueDate', 'ASC']],
      limit: 10,
    }),
  ]);

  res.json({
    success: true,
    data: {
      role: 'TEAM_MEMBER',
      stats: {
        assignedProjects: projectIds.length,
        assignedTasks: assignedTasksTotal,
        completedTasks,
        pendingTasks,
        tasksAwaitingReview,
      },
      upcomingDeadlines,
    },
  });
});

module.exports = { getDashboard };
