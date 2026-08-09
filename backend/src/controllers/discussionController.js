const { Task, TaskDiscussion, User, Project } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { notifyUser } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');
const { assertTaskAccess } = require('./taskController');

const listMessages = catchAsync(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: [{ model: Project, as: 'project' }] });
  if (!task) throw ApiError.notFound('Task not found.');
  await assertTaskAccess(task, req.user);

  const messages = await TaskDiscussion.findAll({
    where: { taskId: task.id },
    include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatarUrl', 'role'] }],
    order: [['createdAt', 'ASC']],
  });

  res.json({ success: true, data: { messages } });
});

const addMessage = catchAsync(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: [{ model: Project, as: 'project' }] });
  if (!task) throw ApiError.notFound('Task not found.');
  await assertTaskAccess(task, req.user);

  const discussion = await TaskDiscussion.create({
    taskId: task.id,
    userId: req.user.id,
    message: req.body.message,
    attachments: req.body.attachments || [],
    links: req.body.links || [],
  });

  await logActivity({ projectId: task.projectId, taskId: task.id, userId: req.user.id, action: 'discussion_added' });

  // Notify everyone relevant to the task except the author
  const notifyTargets = new Set();
  if (task.assigneeId && task.assigneeId !== req.user.id) notifyTargets.add(task.assigneeId);
  if (task.project.managerId !== req.user.id) notifyTargets.add(task.project.managerId);

  await Promise.all(
    [...notifyTargets].map((userId) =>
      notifyUser({
        userId,
        type: 'DISCUSSION_ADDED',
        message: `New comment on task "${task.title}".`,
        link: `/tasks/${task.id}`,
      })
    )
  );

  const full = await TaskDiscussion.findByPk(discussion.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatarUrl', 'role'] }],
  });

  res.status(201).json({ success: true, message: 'Comment added.', data: { message: full } });
});

module.exports = { listMessages, addMessage };
