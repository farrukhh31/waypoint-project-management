const { Op } = require('sequelize');
const { Task, Project, User, ProjectMember, TaskDependency, TaskDiscussion } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { notifyUser, notifyUsers } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');
const { assertProjectAccess } = require('./projectController');
const { buildSort, containsInsensitive, paginationParams, paginationMeta } = require('../utils/queryHelpers');

const TASK_SORT_FIELDS = ['createdAt', 'title', 'dueDate', 'priority', 'status'];

const taskIncludes = [
  { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'avatarUrl'] },
  { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'avatarUrl'] },
  { model: Project, as: 'project', attributes: ['id', 'name', 'managerId'] },
  // Dependency edges — slim enough for the task detail page's "Blocked by" /
  // "Blocking" chips without dragging in full user records.
  { model: Task, as: 'dependsOn', attributes: ['id', 'title', 'status'], through: { attributes: [] } },
  { model: Task, as: 'blocks', attributes: ['id', 'title', 'status'], through: { attributes: [] } },
];

// Slim includes for the timeline/Gantt payload — no need for full user
// records, just enough to draw bars, avatars, and dependency connectors.
const timelineIncludes = [
  { model: User, as: 'assignee', attributes: ['id', 'name', 'avatarUrl'] },
  { model: Project, as: 'project', attributes: ['id', 'name', 'status'] },
  { model: Task, as: 'dependsOn', attributes: ['id'], through: { attributes: [] } },
];

// Resolve a role-scoped project id filter, mirroring listTasks' scoping so
// the timeline endpoint shows exactly what that role is allowed to see.
async function scopedProjectIds(user) {
  if (user.role === 'ADMIN') return null; // no restriction
  if (user.role === 'PROJECT_MANAGER') {
    const managed = await Project.findAll({ where: { managerId: user.id }, attributes: ['id'] });
    return managed.map((p) => p.id);
  }
  const memberships = await ProjectMember.findAll({ where: { userId: user.id }, attributes: ['projectId'] });
  return memberships.map((m) => m.projectId);
}

async function assertTaskAccess(task, user) {
  const project = task.project || (await Project.findByPk(task.projectId));
  await assertProjectAccess(project, user);
}

// GET /api/tasks?projectId=&status=&priority=&assigneeId=&search=&sortBy=&order=&page=&limit=
const listTasks = catchAsync(async (req, res) => {
  const { projectId, status, priority, assigneeId, search, sortBy, order, page, limit } = req.query;
  const { user } = req;

  const where = {};
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;
  if (search) where.title = containsInsensitive(search);

  // Role scoping
  if (user.role === 'TEAM_MEMBER') {
    where.assigneeId = user.id; // team members only ever see their own tasks
  } else if (user.role === 'PROJECT_MANAGER') {
    const managed = await Project.findAll({ where: { managerId: user.id }, attributes: ['id'] });
    where.projectId = { [Op.in]: managed.map((p) => p.id) };
  }
  // ADMIN: no extra scoping — sees everything

  const { limit: limitNum, offset, page: pageNum } = paginationParams(page, limit);

  const { rows, count } = await Task.findAndCountAll({
    where,
    include: taskIncludes,
    order: buildSort(sortBy, order, TASK_SORT_FIELDS, 'createdAt'),
    limit: limitNum,
    offset,
  });

  res.json({
    success: true,
    data: { tasks: rows, pagination: paginationMeta(pageNum, limitNum, count) },
  });
});

// GET /api/tasks/timeline?projectId= — full schedule payload (dates,
// progress, dependency edges) for the multi-view Timeline page's Task
// Gantt and Milestones tabs. Project-scoped Timeline view reuses the
// project list already returned by the dashboard, so this endpoint
// only needs to cover tasks.
const getTimeline = catchAsync(async (req, res) => {
  const { projectId } = req.query;
  const { user } = req;

  const where = {};
  if (projectId) where.projectId = projectId;

  const allowedProjectIds = await scopedProjectIds(user);
  if (allowedProjectIds !== null) {
    where.projectId = projectId
      ? { [Op.in]: allowedProjectIds.filter((id) => id === projectId) }
      : { [Op.in]: allowedProjectIds };
  }

  const tasks = await Task.findAll({
    where,
    include: timelineIncludes,
    order: [['startDate', 'ASC'], ['dueDate', 'ASC']],
  });

  res.json({ success: true, data: { tasks } });
});

const getTask = catchAsync(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: taskIncludes });
  if (!task) throw ApiError.notFound('Task not found.');
  await assertTaskAccess(task, req.user);
  res.json({ success: true, data: { task } });
});

// Replace a task's dependency edges wholesale with the given list of
// task ids it depends on. Silently drops self-references and ids from
// other projects — a Gantt bar can only depend on siblings in the same
// project, which keeps the connector lines and date math meaningful.
async function syncDependencies(task, dependsOnTaskIds) {
  if (!dependsOnTaskIds) return;

  const validIds = dependsOnTaskIds.filter((id) => id && id !== task.id);
  const siblings = validIds.length
    ? await Task.findAll({ where: { id: { [Op.in]: validIds }, projectId: task.projectId }, attributes: ['id'] })
    : [];
  const siblingIds = new Set(siblings.map((t) => t.id));

  await TaskDependency.destroy({ where: { taskId: task.id } });
  if (siblingIds.size) {
    await TaskDependency.bulkCreate([...siblingIds].map((dependsOnTaskId) => ({ taskId: task.id, dependsOnTaskId })));
  }
}

// PM (project owner) or Admin creates tasks
const createTask = catchAsync(async (req, res) => {
  const { title, description, projectId, assigneeId, priority, startDate, dueDate, progress, isMilestone, dependsOnTaskIds } =
    req.body;

  const project = await Project.findByPk(projectId);
  if (!project) throw ApiError.notFound('Project not found.');

  const isAdmin = req.user.role === 'ADMIN';
  const isOwningPM = req.user.role === 'PROJECT_MANAGER' && project.managerId === req.user.id;
  if (!isAdmin && !isOwningPM) throw ApiError.forbidden('Only an Administrator or the assigned Project Manager can create tasks for this project.');

  if (assigneeId) {
    const isMember = await ProjectMember.findOne({ where: { projectId, userId: assigneeId } });
    if (!isMember) throw ApiError.badRequest('The assignee must be a member of this project.');
  }

  const task = await Task.create({
    title,
    description,
    projectId,
    assigneeId: assigneeId || null,
    priority,
    startDate: startDate || null,
    dueDate,
    progress,
    isMilestone,
    creatorId: req.user.id,
  });

  await syncDependencies(task, dependsOnTaskIds);

  await logActivity({ projectId, taskId: task.id, userId: req.user.id, action: 'task_created' });

  if (assigneeId) {
    await notifyUser({
      userId: assigneeId,
      type: 'TASK_ASSIGNED',
      message: `You've been assigned a new task: "${task.title}".`,
      link: `/tasks/${task.id}`,
    });
  }

  const full = await Task.findByPk(task.id, { include: taskIncludes });
  res.status(201).json({ success: true, message: 'Task created.', data: { task: full } });
});

// PM (project owner) or Admin can edit full task details (title, desc, assignee, priority, due date)
const updateTask = catchAsync(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: [{ model: Project, as: 'project' }] });
  if (!task) throw ApiError.notFound('Task not found.');

  const isAdmin = req.user.role === 'ADMIN';
  const isOwningPM = req.user.role === 'PROJECT_MANAGER' && task.project.managerId === req.user.id;
  if (!isAdmin && !isOwningPM) throw ApiError.forbidden('Only an Administrator or the assigned Project Manager can edit this task.');

  const previousAssignee = task.assigneeId;

  if (req.body.assigneeId) {
    const isMember = await ProjectMember.findOne({ where: { projectId: task.projectId, userId: req.body.assigneeId } });
    if (!isMember) throw ApiError.badRequest('The assignee must be a member of this project.');
  }

  const { dependsOnTaskIds, ...taskFields } = req.body;
  await task.update(taskFields);
  await syncDependencies(task, dependsOnTaskIds);
  await logActivity({ projectId: task.projectId, taskId: task.id, userId: req.user.id, action: 'task_updated' });

  if (req.body.assigneeId && req.body.assigneeId !== previousAssignee) {
    await notifyUser({
      userId: req.body.assigneeId,
      type: 'TASK_ASSIGNED',
      message: `You've been assigned to the task: "${task.title}".`,
      link: `/tasks/${task.id}`,
    });
  }

  const full = await Task.findByPk(task.id, { include: taskIncludes });
  res.json({ success: true, message: 'Task updated.', data: { task: full } });
});

// Team member (assignee) or the owning PM can move a task between TODO and
// IN_PROGRESS — plain day-to-day work-in-progress moves. Admins are
// intentionally excluded — they get full visibility across every task but
// stay hands-off on status, which belongs to the people doing (or managing)
// the work. Entering REVIEW happens via submitTask below, and leaving
// REVIEW (approve or request changes) happens via reviewTask — both are
// kept separate from this endpoint so a submission/decision can carry a
// comment and so only the right role can make that call.
const updateStatus = catchAsync(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: [{ model: Project, as: 'project' }] });
  if (!task) throw ApiError.notFound('Task not found.');

  const isOwningPM = req.user.role === 'PROJECT_MANAGER' && task.project.managerId === req.user.id;
  const isAssignee = task.assigneeId === req.user.id;
  if (!isOwningPM && !isAssignee) {
    throw ApiError.forbidden('Only the assignee or the Project Manager can update this task\'s status.');
  }
  if (task.status === 'REVIEW' || task.status === 'COMPLETED') {
    throw ApiError.badRequest(
      task.status === 'REVIEW'
        ? 'This task is awaiting review. The Project Manager can approve it or request changes.'
        : 'This task is already completed.'
    );
  }

  const previousStatus = task.status;
  task.status = req.body.status;
  await task.save();

  await logActivity({
    projectId: task.projectId,
    taskId: task.id,
    userId: req.user.id,
    action: 'task_status_changed',
    metadata: { from: previousStatus, to: task.status },
  });

  // Notify the PM (project manager) when a team member updates status, and vice versa
  const notifyTargets = new Set();
  if (task.project.managerId !== req.user.id) notifyTargets.add(task.project.managerId);
  if (task.assigneeId && task.assigneeId !== req.user.id) notifyTargets.add(task.assigneeId);

  await Promise.all(
    [...notifyTargets].map((userId) =>
      notifyUser({
        userId,
        type: 'TASK_STATUS_CHANGED',
        message: `Task "${task.title}" status changed to ${task.status.replace('_', ' ')}.`,
        link: `/tasks/${task.id}`,
      })
    )
  );

  const full = await Task.findByPk(task.id, { include: taskIncludes });
  res.json({ success: true, message: 'Task status updated.', data: { task: full } });
});

// Assignee submits their work for the Project Manager's review. Moves
// TODO/IN_PROGRESS -> REVIEW. This is the "task submission" step — after
// this, only the owning PM can move the task forward (see reviewTask).
const submitTask = catchAsync(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: [{ model: Project, as: 'project' }] });
  if (!task) throw ApiError.notFound('Task not found.');

  if (task.assigneeId !== req.user.id) {
    throw ApiError.forbidden('Only the assignee can submit this task for review.');
  }
  if (task.status !== 'TODO' && task.status !== 'IN_PROGRESS') {
    throw ApiError.badRequest(
      task.status === 'REVIEW' ? 'This task has already been submitted for review.' : 'This task is already completed.'
    );
  }

  task.status = 'REVIEW';
  await task.save();

  await TaskDiscussion.create({
    taskId: task.id,
    userId: req.user.id,
    kind: 'SUBMITTED',
    message: req.body?.comment?.trim() || 'Submitted this task for review.',
    attachments: req.body?.attachments || [],
    links: req.body?.links || [],
  });

  await logActivity({ projectId: task.projectId, taskId: task.id, userId: req.user.id, action: 'task_submitted' });

  if (task.project.managerId !== req.user.id) {
    await notifyUser({
      userId: task.project.managerId,
      type: 'TASK_SUBMITTED',
      message: `"${task.title}" was submitted for your review.`,
      link: `/tasks/${task.id}`,
    });
  }

  // Admins don't review tasks (that stays the owning PM's call — see
  // reviewTask), but they get full visibility across every task, so keep
  // them in the loop when one is submitted rather than only surfacing it
  // once a PM has already acted on it.
  const admins = await User.findAll({ where: { role: 'ADMIN' }, attributes: ['id'] });
  await notifyUsers(
    admins.map((a) => a.id),
    {
      type: 'TASK_SUBMITTED',
      message: `"${task.title}" was submitted for review by ${req.user.name}.`,
      link: `/tasks/${task.id}`,
    }
  );

  const full = await Task.findByPk(task.id, { include: taskIncludes });
  res.json({ success: true, message: 'Task submitted for review.', data: { task: full } });
});

// Assignee withdraws their own submission — only while it's still pending
// (no decision made yet). Pulls the task back to IN_PROGRESS so they can
// keep working and resubmit whenever they're ready, instead of being
// stuck waiting on a submission they want to revise. Once the owning PM
// (or an Admin) has actually decided, this is no longer "pending" — that
// decision has to be undone by them instead (see undoTaskReview).
const undoSubmitTask = catchAsync(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: [{ model: Project, as: 'project' }] });
  if (!task) throw ApiError.notFound('Task not found.');

  if (task.assigneeId !== req.user.id) {
    throw ApiError.forbidden('Only the assignee can withdraw this submission.');
  }

  const latestEntry = await TaskDiscussion.findOne({
    where: { taskId: task.id },
    order: [['createdAt', 'DESC']],
  });
  if (task.status !== 'REVIEW' || !latestEntry || latestEntry.kind !== 'SUBMITTED') {
    throw ApiError.badRequest(
      'This task isn\'t awaiting review, or it has already been reviewed — ask the Project Manager to undo their decision instead.'
    );
  }

  task.status = 'IN_PROGRESS';
  await task.save();
  await latestEntry.destroy();

  await logActivity({ projectId: task.projectId, taskId: task.id, userId: req.user.id, action: 'task_submission_undone' });

  if (task.project.managerId !== req.user.id) {
    await notifyUser({
      userId: task.project.managerId,
      type: 'TASK_STATUS_CHANGED',
      message: `"${task.title}" submission was withdrawn — it's back in progress.`,
      link: `/tasks/${task.id}`,
    });
  }

  const full = await Task.findByPk(task.id, { include: taskIncludes });
  res.json({ success: true, message: 'Submission withdrawn — task is back in progress.', data: { task: full } });
});

// Owning Project Manager reviews a submitted task: approve (-> COMPLETED)
// or request changes (-> back to IN_PROGRESS, with a required comment
// explaining what needs to be redone). Deliberately PM-only, not Admin —
// task review is the Project Manager's call; Admins review projects.
const reviewTask = catchAsync(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: [{ model: Project, as: 'project' }] });
  if (!task) throw ApiError.notFound('Task not found.');

  const isOwningPM = req.user.role === 'PROJECT_MANAGER' && task.project.managerId === req.user.id;
  if (!isOwningPM) {
    throw ApiError.forbidden('Only the Project Manager for this project can review this task.');
  }
  if (task.status !== 'REVIEW') {
    throw ApiError.badRequest('This task is not currently awaiting review.');
  }

  const { decision, comment, attachments, links } = req.body;
  const approved = decision === 'approve';

  task.status = approved ? 'COMPLETED' : 'IN_PROGRESS';
  if (approved) task.progress = 100;
  await task.save();

  await TaskDiscussion.create({
    taskId: task.id,
    userId: req.user.id,
    kind: approved ? 'APPROVED' : 'CHANGES_REQUESTED',
    message: comment?.trim() || (approved ? 'Approved.' : 'Requested changes.'),
    attachments: attachments || [],
    links: links || [],
  });

  await logActivity({
    projectId: task.projectId,
    taskId: task.id,
    userId: req.user.id,
    action: approved ? 'task_approved' : 'task_changes_requested',
    metadata: comment ? { comment } : undefined,
  });

  if (task.assigneeId) {
    await notifyUser({
      userId: task.assigneeId,
      type: approved ? 'TASK_APPROVED' : 'TASK_CHANGES_REQUESTED',
      message: approved
        ? `"${task.title}" was approved and marked complete.`
        : `Changes were requested on "${task.title}". Check the comments for details.`,
      link: `/tasks/${task.id}`,
    });
  }

  const full = await Task.findByPk(task.id, { include: taskIncludes });
  res.json({
    success: true,
    message: approved ? 'Task approved and marked complete.' : 'Changes requested — task sent back to In Progress.',
    data: { task: full },
  });
});

// Undoes the most recent review decision (approve or request changes),
// putting the task back in REVIEW so the owning PM — or an Admin, as an
// override — can reconsider. Only ever touches the *latest* discussion
// entry: if the assignee has already resubmitted since that decision, it's
// history rather than the current state, and undoing it would silently
// discard that resubmission's context, so it's blocked.
const undoTaskReview = catchAsync(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: [{ model: Project, as: 'project' }] });
  if (!task) throw ApiError.notFound('Task not found.');

  const isAdmin = req.user.role === 'ADMIN';
  const isOwningPM = req.user.role === 'PROJECT_MANAGER' && task.project.managerId === req.user.id;
  if (!isAdmin && !isOwningPM) {
    throw ApiError.forbidden('Only the Project Manager for this project or an Administrator can undo a review decision.');
  }

  const latestEntry = await TaskDiscussion.findOne({
    where: { taskId: task.id },
    order: [['createdAt', 'DESC']],
  });
  if (!latestEntry || !['APPROVED', 'CHANGES_REQUESTED'].includes(latestEntry.kind)) {
    throw ApiError.badRequest('There is no review decision to undo.');
  }

  const wasApproved = latestEntry.kind === 'APPROVED';
  task.status = 'REVIEW';
  await task.save();
  await latestEntry.destroy();

  await logActivity({
    projectId: task.projectId,
    taskId: task.id,
    userId: req.user.id,
    action: 'task_review_undone',
    metadata: { undidDecision: wasApproved ? 'approved' : 'changes_requested' },
  });

  if (task.assigneeId && task.assigneeId !== req.user.id) {
    await notifyUser({
      userId: task.assigneeId,
      type: 'TASK_STATUS_CHANGED',
      message: `The review decision on "${task.title}" was undone — it's back in review.`,
      link: `/tasks/${task.id}`,
    });
  }

  const full = await Task.findByPk(task.id, { include: taskIncludes });
  res.json({ success: true, message: 'Review decision undone — task is back in review.', data: { task: full } });
});

// PM (project owner) or Admin drags a Gantt bar to a new position — a
// focused endpoint so a reschedule doesn't need to resend the whole task.
const rescheduleTask = catchAsync(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: [{ model: Project, as: 'project' }] });
  if (!task) throw ApiError.notFound('Task not found.');

  const isAdmin = req.user.role === 'ADMIN';
  const isOwningPM = req.user.role === 'PROJECT_MANAGER' && task.project.managerId === req.user.id;
  if (!isAdmin && !isOwningPM) throw ApiError.forbidden('Only an Administrator or the assigned Project Manager can reschedule this task.');

  task.startDate = req.body.startDate;
  task.dueDate = req.body.dueDate;
  await task.save();

  await logActivity({
    projectId: task.projectId,
    taskId: task.id,
    userId: req.user.id,
    action: 'task_rescheduled',
  });

  const full = await Task.findByPk(task.id, { include: timelineIncludes });
  res.json({ success: true, message: 'Task rescheduled.', data: { task: full } });
});

const deleteTask = catchAsync(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: [{ model: Project, as: 'project' }] });
  if (!task) throw ApiError.notFound('Task not found.');

  const isAdmin = req.user.role === 'ADMIN';
  const isOwningPM = req.user.role === 'PROJECT_MANAGER' && task.project.managerId === req.user.id;
  if (!isAdmin && !isOwningPM) throw ApiError.forbidden('Only an Administrator or the assigned Project Manager can delete this task.');

  await task.destroy();
  res.json({ success: true, message: 'Task deleted.' });
});

module.exports = {
  listTasks,
  getTimeline,
  getTask,
  createTask,
  updateTask,
  updateStatus,
  submitTask,
  undoSubmitTask,
  reviewTask,
  undoTaskReview,
  rescheduleTask,
  deleteTask,
  assertTaskAccess,
};
