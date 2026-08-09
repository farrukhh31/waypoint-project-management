const { ActivityLog, User, Project } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { assertProjectAccess } = require('./projectController');

// GET /api/activity/project/:projectId
const getProjectTimeline = catchAsync(async (req, res) => {
  const project = await Project.findByPk(req.params.projectId);
  if (!project) throw ApiError.notFound('Project not found.');
  await assertProjectAccess(project, req.user);

  const logs = await ActivityLog.findAll({
    where: { projectId: project.id },
    include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'avatarUrl', 'role'] }],
    order: [['createdAt', 'DESC']],
    limit: 100,
  });

  res.json({ success: true, data: { logs } });
});

module.exports = { getProjectTimeline };
