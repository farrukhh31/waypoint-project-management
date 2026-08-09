const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Project, User, ProjectMember, Task, ProjectDiscussion } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { notifyUser, notifyUsers } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');
const { buildSort, containsInsensitive, paginationParams, paginationMeta } = require('../utils/queryHelpers');

const PROJECT_SORT_FIELDS = ['createdAt', 'name', 'startDate', 'endDate', 'priority', 'status'];

const projectIncludes = [
  { model: User, as: 'manager', attributes: ['id', 'name', 'email', 'avatarUrl'] },
  { model: User, as: 'members', attributes: ['id', 'name', 'email', 'avatarUrl', 'role'], through: { attributes: [] } },
];

async function assertProjectAccess(project, user) {
  if (user.role === 'ADMIN') return;
  if (user.role === 'PROJECT_MANAGER' && project.managerId === user.id) return;

  const isMember = await ProjectMember.findOne({ where: { projectId: project.id, userId: user.id } });
  if (isMember) return;

  throw ApiError.forbidden('You do not have access to this project.');
}

// Shared by submitProject and updateProject's legacy COMPLETED guard: a
// project can't move to a "done" state while tasks are still open.
async function findIncompleteTasks(projectId) {
  return Task.findAll({
    where: { projectId, status: { [Op.ne]: 'COMPLETED' } },
    attributes: ['id', 'title', 'status'],
    order: [['createdAt', 'ASC']],
  });
}

// GET /api/projects?search=&status=&priority=&sortBy=&order=&page=&limit=
const listProjects = catchAsync(async (req, res) => {
  const { search, status, priority, sortBy, order, page, limit } = req.query;
  const { user } = req;

  const where = {};
  if (search) where.name = containsInsensitive(search);
  if (status) where.status = status;
  if (priority) where.priority = priority;

  // Role-based scoping: Admin sees all; PM sees managed; Team Member sees only projects they belong to.
  if (user.role === 'PROJECT_MANAGER') {
    where.managerId = user.id;
  } else if (user.role === 'TEAM_MEMBER') {
    const memberships = await ProjectMember.findAll({ where: { userId: user.id } });
    where.id = { [Op.in]: memberships.map((m) => m.projectId) };
  }
  // ADMIN: no extra scoping — sees everything

  const { limit: limitNum, offset, page: pageNum } = paginationParams(page, limit);

  const { rows, count } = await Project.findAndCountAll({
    where,
    include: projectIncludes,
    order: buildSort(sortBy, order, PROJECT_SORT_FIELDS, 'createdAt'),
    limit: limitNum,
    offset,
    distinct: true, // required for correct counts when joining the members many-to-many
  });

  // Lightweight per-project task progress for the current page only —
  // cheap enough to compute on every list call, and lets the UI show a
  // real completion bar instead of just a status pill.
  const projectIds = rows.map((p) => p.id);
  const taskRows = projectIds.length
    ? await Task.findAll({ where: { projectId: { [Op.in]: projectIds } }, attributes: ['projectId', 'status'] })
    : [];
  const progressByProject = {};
  for (const id of projectIds) progressByProject[id] = { total: 0, completed: 0 };
  for (const t of taskRows) {
    progressByProject[t.projectId].total += 1;
    if (t.status === 'COMPLETED') progressByProject[t.projectId].completed += 1;
  }
  const projects = rows.map((p) => ({ ...p.toJSON(), progress: progressByProject[p.id] }));

  // Status breakdown across the role-scoped, search-filtered set (ignoring
  // the `status` filter itself) so the UI can render live filter-pill
  // counts that don't collapse to one number once a status is selected.
  const { status: _status, ...whereForCounts } = where;
  const statusRows = await Project.findAll({
    where: whereForCounts,
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['status'],
    raw: true,
  });
  const statusCounts = statusRows.reduce((acc, r) => ({ ...acc, [r.status]: parseInt(r.count, 10) }), {});

  res.json({
    success: true,
    data: { projects, pagination: paginationMeta(pageNum, limitNum, count), statusCounts },
  });
});

const getProject = catchAsync(async (req, res) => {
  const project = await Project.findByPk(req.params.id, { include: projectIncludes });
  if (!project) throw ApiError.notFound('Project not found.');
  await assertProjectAccess(project, req.user);

  const taskStats = await Task.findAll({
    where: { projectId: project.id },
    attributes: ['status'],
  });
  const progress = {
    total: taskStats.length,
    todo: taskStats.filter((t) => t.status === 'TODO').length,
    inProgress: taskStats.filter((t) => t.status === 'IN_PROGRESS').length,
    review: taskStats.filter((t) => t.status === 'REVIEW').length,
    completed: taskStats.filter((t) => t.status === 'COMPLETED').length,
  };

  res.json({ success: true, data: { project, progress } });
});

// Admin only: create project + assign PM + optionally seed initial members
const createProject = catchAsync(async (req, res) => {
  const { name, description, startDate, endDate, priority, status, managerId, memberIds } = req.body;

  const manager = await User.findByPk(managerId);
  if (!manager || manager.role !== 'PROJECT_MANAGER') {
    throw ApiError.badRequest('managerId must reference an existing user with the Project Manager role.');
  }

  const project = await Project.create({
    name,
    description,
    startDate,
    endDate,
    priority,
    status,
    managerId,
  });

  const uniqueMemberIds = [...new Set(memberIds || [])];
  if (uniqueMemberIds.length) {
    await ProjectMember.bulkCreate(uniqueMemberIds.map((userId) => ({ projectId: project.id, userId })));
  }

  await logActivity({ projectId: project.id, userId: req.user.id, action: 'project_created' });

  await notifyUsers([managerId, ...uniqueMemberIds], {
    type: 'PROJECT_ASSIGNED',
    message: `You've been added to the project "${project.name}".`,
    link: `/projects/${project.id}`,
  });

  const full = await Project.findByPk(project.id, { include: projectIncludes });
  res.status(201).json({ success: true, message: 'Project created.', data: { project: full } });
});

// Admin (any field) or the assigned PM (project info, not reassigning themselves) can update
const updateProject = catchAsync(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw ApiError.notFound('Project not found.');

  const isAdmin = req.user.role === 'ADMIN';
  const isOwningPM = req.user.role === 'PROJECT_MANAGER' && project.managerId === req.user.id;
  if (!isAdmin && !isOwningPM) throw ApiError.forbidden('Only an Administrator or the assigned Project Manager can update this project.');

  // Only Admins may reassign the Project Manager
  if (req.body.managerId && !isAdmin) {
    throw ApiError.forbidden('Only an Administrator can reassign the Project Manager.');
  }
  if (req.body.managerId) {
    const manager = await User.findByPk(req.body.managerId);
    if (!manager || manager.role !== 'PROJECT_MANAGER') {
      throw ApiError.badRequest('managerId must reference an existing user with the Project Manager role.');
    }
  }

  // Nobody sets COMPLETED or PENDING_APPROVAL through the generic update
  // endpoint — those are only reachable through the submit/review flow
  // (POST /projects/:id/submit and /:id/review) so an approval always
  // carries proper attribution and, for a rejection, a required comment.
  // Only guard an actual transition — resaving other fields on an already
  // COMPLETED/PENDING_APPROVAL project without touching status must not trip this.
  if (req.body.status && req.body.status !== project.status && (req.body.status === 'COMPLETED' || req.body.status === 'PENDING_APPROVAL')) {
    throw ApiError.badRequest(
      req.body.status === 'COMPLETED'
        ? 'A project can only be completed by an Administrator approving a submission. Use "Submit for Approval" first.'
        : 'Use "Submit for Approval" to move a project into review.'
    );
  }

  await project.update(req.body);
  await logActivity({ projectId: project.id, userId: req.user.id, action: 'project_updated' });

  const full = await Project.findByPk(project.id, { include: projectIncludes });
  res.json({ success: true, message: 'Project updated.', data: { project: full } });
});

// Owning PM submits the project for the Administrator's approval, once
// every task is done. Moves ACTIVE/ON_HOLD -> PENDING_APPROVAL. This is
// the "project submission" step — after this, only an Admin can move it
// forward (see reviewProject).
const submitProject = catchAsync(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw ApiError.notFound('Project not found.');

  const isOwningPM = req.user.role === 'PROJECT_MANAGER' && project.managerId === req.user.id;
  if (!isOwningPM) throw ApiError.forbidden('Only the assigned Project Manager can submit this project for approval.');

  if (project.status === 'COMPLETED' || project.status === 'CANCELLED') {
    throw ApiError.badRequest(`This project is already ${project.status.toLowerCase()}.`);
  }
  if (project.status === 'PENDING_APPROVAL') {
    throw ApiError.badRequest('This project has already been submitted and is awaiting approval.');
  }

  const incompleteTasks = await findIncompleteTasks(project.id);
  if (incompleteTasks.length > 0) {
    throw ApiError.badRequest(
      `This project can't be submitted yet — ${incompleteTasks.length} task${incompleteTasks.length === 1 ? '' : 's'} still open.`,
      {
        code: 'PROJECT_HAS_INCOMPLETE_TASKS',
        incompleteTasks: incompleteTasks.map((t) => ({ id: t.id, title: t.title, status: t.status })),
      }
    );
  }

  project.status = 'PENDING_APPROVAL';
  await project.save();

  await ProjectDiscussion.create({
    projectId: project.id,
    userId: req.user.id,
    kind: 'SUBMITTED',
    message: req.body?.comment?.trim() || 'Submitted this project for approval.',
    attachments: req.body?.attachments || [],
    links: req.body?.links || [],
  });

  await logActivity({ projectId: project.id, userId: req.user.id, action: 'project_submitted' });

  const admins = await User.findAll({ where: { role: 'ADMIN' }, attributes: ['id'] });
  await notifyUsers(
    admins.map((a) => a.id),
    {
      type: 'PROJECT_SUBMITTED',
      message: `"${project.name}" was submitted for your approval.`,
      link: `/projects/${project.id}`,
    }
  );

  const full = await Project.findByPk(project.id, { include: projectIncludes });
  res.json({ success: true, message: 'Project submitted for approval.', data: { project: full } });
});

// Owning PM withdraws their own pending (undecided) submission — pulls the
// project back to ACTIVE so they can keep working and resubmit. Mirrors
// undoSubmitTask in taskController.js. Once an Admin has actually decided,
// this is no longer "pending" — that decision has to be undone by them
// instead (see undoProjectReview).
const undoSubmitProject = catchAsync(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw ApiError.notFound('Project not found.');

  const isOwningPM = req.user.role === 'PROJECT_MANAGER' && project.managerId === req.user.id;
  if (!isOwningPM) throw ApiError.forbidden('Only the assigned Project Manager can withdraw this submission.');

  const latestEntry = await ProjectDiscussion.findOne({
    where: { projectId: project.id },
    order: [['createdAt', 'DESC']],
  });
  if (project.status !== 'PENDING_APPROVAL' || !latestEntry || latestEntry.kind !== 'SUBMITTED') {
    throw ApiError.badRequest(
      'This project isn\'t awaiting approval, or it has already been reviewed — ask an Administrator to undo their decision instead.'
    );
  }

  project.status = 'ACTIVE';
  await project.save();
  await latestEntry.destroy();

  await logActivity({ projectId: project.id, userId: req.user.id, action: 'project_submission_undone' });

  const full = await Project.findByPk(project.id, { include: projectIncludes });
  res.json({ success: true, message: 'Submission withdrawn — project is back to Active.', data: { project: full } });
});

// Administrator reviews a submitted project: approve (-> COMPLETED) or
// request changes (-> back to ACTIVE, with a required comment). Admin-only
// — project sign-off is the Administrator's call; PMs review tasks.
const reviewProject = catchAsync(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw ApiError.notFound('Project not found.');

  if (project.status !== 'PENDING_APPROVAL') {
    throw ApiError.badRequest('This project is not currently awaiting approval.');
  }

  const { decision, comment, attachments, links } = req.body;
  const approved = decision === 'approve';

  project.status = approved ? 'COMPLETED' : 'ACTIVE';
  await project.save();

  await ProjectDiscussion.create({
    projectId: project.id,
    userId: req.user.id,
    kind: approved ? 'APPROVED' : 'CHANGES_REQUESTED',
    message: comment?.trim() || (approved ? 'Approved.' : 'Requested changes.'),
    attachments: attachments || [],
    links: links || [],
  });

  await logActivity({
    projectId: project.id,
    userId: req.user.id,
    action: approved ? 'project_approved' : 'project_changes_requested',
    metadata: comment ? { comment } : undefined,
  });

  await notifyUser({
    userId: project.managerId,
    type: approved ? 'PROJECT_APPROVED' : 'PROJECT_CHANGES_REQUESTED',
    message: approved
      ? `"${project.name}" was approved and marked complete.`
      : `Changes were requested on "${project.name}". Check the comments for details.`,
    link: `/projects/${project.id}`,
  });

  const full = await Project.findByPk(project.id, { include: projectIncludes });
  res.json({
    success: true,
    message: approved ? 'Project approved and marked complete.' : 'Changes requested — project sent back to Active.',
    data: { project: full },
  });
});

// Admin-only undo of the most recent approve/request-changes decision,
// putting the project back to PENDING_APPROVAL so it can be reconsidered.
// Mirrors undoTaskReview in taskController.js — only the latest discussion
// entry can be undone, so a decision that's already been superseded by a
// resubmission can't be silently discarded.
const undoProjectReview = catchAsync(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw ApiError.notFound('Project not found.');

  const latestEntry = await ProjectDiscussion.findOne({
    where: { projectId: project.id },
    order: [['createdAt', 'DESC']],
  });
  if (!latestEntry || !['APPROVED', 'CHANGES_REQUESTED'].includes(latestEntry.kind)) {
    throw ApiError.badRequest('There is no approval decision to undo.');
  }

  const wasApproved = latestEntry.kind === 'APPROVED';
  project.status = 'PENDING_APPROVAL';
  await project.save();
  await latestEntry.destroy();

  await logActivity({
    projectId: project.id,
    userId: req.user.id,
    action: 'project_review_undone',
    metadata: { undidDecision: wasApproved ? 'approved' : 'changes_requested' },
  });

  if (project.managerId !== req.user.id) {
    await notifyUser({
      userId: project.managerId,
      type: 'PROJECT_SUBMITTED',
      message: `The approval decision on "${project.name}" was undone — it's back awaiting approval.`,
      link: `/projects/${project.id}`,
    });
  }

  const full = await Project.findByPk(project.id, { include: projectIncludes });
  res.json({ success: true, message: 'Approval decision undone — project is back awaiting approval.', data: { project: full } });
});

const deleteProject = catchAsync(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw ApiError.notFound('Project not found.');
  // Only admin can delete (enforced at route level too)
  await project.destroy();
  res.json({ success: true, message: 'Project deleted.' });
});

// PM (owner) or Admin: add members
const addMembers = catchAsync(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw ApiError.notFound('Project not found.');

  const isAdmin = req.user.role === 'ADMIN';
  const isOwningPM = req.user.role === 'PROJECT_MANAGER' && project.managerId === req.user.id;
  if (!isAdmin && !isOwningPM) throw ApiError.forbidden('Only an Administrator or the assigned Project Manager can manage members.');

  const { memberIds } = req.body;
  const existing = await ProjectMember.findAll({ where: { projectId: project.id } });
  const existingIds = new Set(existing.map((m) => m.userId));
  const toAdd = memberIds.filter((id) => !existingIds.has(id));

  if (toAdd.length) {
    await ProjectMember.bulkCreate(toAdd.map((userId) => ({ projectId: project.id, userId })));
    await notifyUsers(toAdd, {
      type: 'MEMBER_ADDED',
      message: `You've been added to the project "${project.name}".`,
      link: `/projects/${project.id}`,
    });
    await logActivity({ projectId: project.id, userId: req.user.id, action: 'members_added', metadata: { toAdd } });
  }

  const full = await Project.findByPk(project.id, { include: projectIncludes });
  res.json({ success: true, message: 'Members added.', data: { project: full } });
});

// PM (owner) or Admin: remove a member
const removeMember = catchAsync(async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw ApiError.notFound('Project not found.');

  const isAdmin = req.user.role === 'ADMIN';
  const isOwningPM = req.user.role === 'PROJECT_MANAGER' && project.managerId === req.user.id;
  if (!isAdmin && !isOwningPM) throw ApiError.forbidden('Only an Administrator or the assigned Project Manager can manage members.');

  await ProjectMember.destroy({ where: { projectId: project.id, userId: req.params.userId } });
  await logActivity({ projectId: project.id, userId: req.user.id, action: 'member_removed', metadata: { userId: req.params.userId } });

  const full = await Project.findByPk(project.id, { include: projectIncludes });
  res.json({ success: true, message: 'Member removed.', data: { project: full } });
});

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  submitProject,
  undoSubmitProject,
  reviewProject,
  undoProjectReview,
  deleteProject,
  addMembers,
  removeMember,
  assertProjectAccess,
};
