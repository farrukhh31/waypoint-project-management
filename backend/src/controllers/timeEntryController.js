const { TimeEntry, Project, Task } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { paginationParams, paginationMeta } = require('../utils/queryHelpers');

const timeEntryIncludes = [
  { model: Project, as: 'project', attributes: ['id', 'name'] },
  { model: Task, as: 'task', attributes: ['id', 'title'] },
];

// Every entry the frontend renders needs a single "elapsedSeconds" number —
// computing it here (rather than trusting a client-tracked value) means a
// stale tab or a laptop that was asleep can never desync from the server.
function withElapsed(entry) {
  const json = entry.toJSON();
  let elapsed = json.accumulatedSeconds;
  if (json.status === 'RUNNING' && json.lastResumedAt) {
    elapsed += Math.floor((Date.now() - new Date(json.lastResumedAt).getTime()) / 1000);
  }
  return { ...json, elapsedSeconds: Math.max(elapsed, 0) };
}

// GET /api/time-entries/active — the one entry (if any) currently RUNNING or
// PAUSED for this user, which is all the "Time tracking" widget needs.
const getActive = catchAsync(async (req, res) => {
  const entry = await TimeEntry.findOne({
    where: { userId: req.user.id, status: ['RUNNING', 'PAUSED'] },
    include: timeEntryIncludes,
  });
  res.json({ success: true, data: { entry: entry ? withElapsed(entry) : null } });
});

// GET /api/time-entries?page=&limit= — recent history, most recent first.
const listEntries = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const { limit: limitNum, offset, page: pageNum } = paginationParams(page, limit, { defaultLimit: 10 });

  const { rows, count } = await TimeEntry.findAndCountAll({
    where: { userId: req.user.id },
    include: timeEntryIncludes,
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset,
  });

  res.json({
    success: true,
    data: { entries: rows.map(withElapsed), pagination: paginationMeta(pageNum, limitNum, count) },
  });
});

// POST /api/time-entries/start — stops any existing active entry for this
// user (a person only ever tracks one thing at a time) and starts a new one.
const startEntry = catchAsync(async (req, res) => {
  const { label, projectId, taskId } = req.body;

  const existing = await TimeEntry.findOne({ where: { userId: req.user.id, status: ['RUNNING', 'PAUSED'] } });
  if (existing) {
    await stopEntryRecord(existing);
  }

  const now = new Date();
  const entry = await TimeEntry.create({
    label,
    projectId: projectId || null,
    taskId: taskId || null,
    userId: req.user.id,
    status: 'RUNNING',
    startedAt: now,
    lastResumedAt: now,
    accumulatedSeconds: 0,
  });

  const full = await TimeEntry.findByPk(entry.id, { include: timeEntryIncludes });
  res.status(201).json({ success: true, message: 'Timer started.', data: { entry: withElapsed(full) } });
});

async function assertOwnedActiveEntry(id, userId) {
  const entry = await TimeEntry.findByPk(id);
  if (!entry) throw ApiError.notFound('Time entry not found.');
  if (entry.userId !== userId) throw ApiError.forbidden('This time entry belongs to someone else.');
  return entry;
}

// POST /api/time-entries/:id/pause
const pauseEntry = catchAsync(async (req, res) => {
  const entry = await assertOwnedActiveEntry(req.params.id, req.user.id);
  if (entry.status !== 'RUNNING') throw ApiError.badRequest('Only a running timer can be paused.');

  const elapsedSinceResume = Math.floor((Date.now() - new Date(entry.lastResumedAt).getTime()) / 1000);
  entry.accumulatedSeconds += Math.max(elapsedSinceResume, 0);
  entry.lastResumedAt = null;
  entry.status = 'PAUSED';
  await entry.save();

  const full = await TimeEntry.findByPk(entry.id, { include: timeEntryIncludes });
  res.json({ success: true, message: 'Timer paused.', data: { entry: withElapsed(full) } });
});

// POST /api/time-entries/:id/resume
const resumeEntry = catchAsync(async (req, res) => {
  const entry = await assertOwnedActiveEntry(req.params.id, req.user.id);
  if (entry.status !== 'PAUSED') throw ApiError.badRequest('Only a paused timer can be resumed.');

  entry.lastResumedAt = new Date();
  entry.status = 'RUNNING';
  await entry.save();

  const full = await TimeEntry.findByPk(entry.id, { include: timeEntryIncludes });
  res.json({ success: true, message: 'Timer resumed.', data: { entry: withElapsed(full) } });
});

async function stopEntryRecord(entry) {
  if (entry.status === 'RUNNING' && entry.lastResumedAt) {
    const elapsedSinceResume = Math.floor((Date.now() - new Date(entry.lastResumedAt).getTime()) / 1000);
    entry.accumulatedSeconds += Math.max(elapsedSinceResume, 0);
  }
  entry.lastResumedAt = null;
  entry.status = 'STOPPED';
  entry.stoppedAt = new Date();
  await entry.save();
  return entry;
}

// POST /api/time-entries/:id/stop
const stopEntry = catchAsync(async (req, res) => {
  const entry = await assertOwnedActiveEntry(req.params.id, req.user.id);
  if (entry.status === 'STOPPED') throw ApiError.badRequest('This timer has already been stopped.');

  await stopEntryRecord(entry);

  const full = await TimeEntry.findByPk(entry.id, { include: timeEntryIncludes });
  res.json({ success: true, message: 'Timer stopped.', data: { entry: withElapsed(full) } });
});

module.exports = { getActive, listEntries, startEntry, pauseEntry, resumeEntry, stopEntry };
