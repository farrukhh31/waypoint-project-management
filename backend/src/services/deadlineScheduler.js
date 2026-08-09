const { Op } = require('sequelize');
const { Task, Notification } = require('../models');
const { notifyUser } = require('./notificationService');

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly
const DEADLINE_WINDOW_HOURS = 24;

// Finds tasks due within the next 24h that are not completed, and whose
// assignee hasn't already been notified about this specific deadline today.
async function checkApproachingDeadlines() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + DEADLINE_WINDOW_HOURS * 60 * 60 * 1000);

  const tasks = await Task.findAll({
    where: {
      dueDate: { [Op.between]: [now, windowEnd] },
      status: { [Op.ne]: 'COMPLETED' },
      assigneeId: { [Op.ne]: null },
    },
  });

  for (const task of tasks) {
    // Avoid duplicate spam: skip if a deadline notification for this task was already sent in the last 20 hours
    const recentDupe = await Notification.findOne({
      where: {
        userId: task.assigneeId,
        type: 'DEADLINE_APPROACHING',
        link: `/tasks/${task.id}`,
        createdAt: { [Op.gte]: new Date(now.getTime() - 20 * 60 * 60 * 1000) },
      },
    });
    if (recentDupe) continue;

    await notifyUser({
      userId: task.assigneeId,
      type: 'DEADLINE_APPROACHING',
      message: `Task "${task.title}" is due soon.`,
      link: `/tasks/${task.id}`,
    });
  }
}

function startDeadlineScheduler() {
  // Run once shortly after boot, then on a fixed interval
  setTimeout(checkApproachingDeadlines, 10 * 1000);
  setInterval(checkApproachingDeadlines, CHECK_INTERVAL_MS);
}

module.exports = { startDeadlineScheduler, checkApproachingDeadlines };
