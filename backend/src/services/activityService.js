const { ActivityLog } = require('../models');

/**
 * Record an activity event for a project and/or task.
 * @param {object} opts
 * @param {string} [opts.projectId]
 * @param {string} [opts.taskId]
 * @param {string} opts.userId - actor who performed the action
 * @param {string} opts.action - short machine-readable action code, e.g. "task_created"
 * @param {object} [opts.metadata]
 */
async function logActivity({ projectId, taskId, userId, action, metadata }) {
  return ActivityLog.create({
    projectId: projectId || null,
    taskId: taskId || null,
    userId,
    action,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

module.exports = { logActivity };
