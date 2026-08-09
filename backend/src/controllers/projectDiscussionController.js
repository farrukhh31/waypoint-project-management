const { Project, ProjectDiscussion, User } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { notifyUser } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');
const { assertProjectAccess } = require('./projectController');

const listMessages = catchAsync(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw ApiError.notFound('Project not found.');
  await assertProjectAccess(project, req.user);

  const messages = await ProjectDiscussion.findAll({
    where: { projectId: project.id },
    include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatarUrl', 'role'] }],
    order: [['createdAt', 'ASC']],
  });

  res.json({ success: true, data: { messages } });
});

const addMessage = catchAsync(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw ApiError.notFound('Project not found.');
  await assertProjectAccess(project, req.user);

  const discussion = await ProjectDiscussion.create({
    projectId: project.id,
    userId: req.user.id,
    message: req.body.message,
    attachments: req.body.attachments || [],
    links: req.body.links || [],
  });

  await logActivity({ projectId: project.id, userId: req.user.id, action: 'discussion_added' });

  // Notify the PM when someone else comments, and vice versa
  if (project.managerId !== req.user.id) {
    await notifyUser({
      userId: project.managerId,
      type: 'DISCUSSION_ADDED',
      message: `New comment on project "${project.name}".`,
      link: `/projects/${project.id}`,
    });
  }

  const full = await ProjectDiscussion.findByPk(discussion.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatarUrl', 'role'] }],
  });

  res.status(201).json({ success: true, message: 'Comment added.', data: { message: full } });
});

module.exports = { listMessages, addMessage };
