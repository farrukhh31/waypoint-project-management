const { Op } = require('sequelize');
const { Meeting } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// GET /api/meetings/today — this user's agenda for the current day, for the
// "Today's meetings" dashboard widget.
const listToday = catchAsync(async (req, res) => {
  const now = new Date();
  const meetings = await Meeting.findAll({
    where: { userId: req.user.id, startTime: { [Op.between]: [startOfDay(now), endOfDay(now)] } },
    order: [['startTime', 'ASC']],
  });
  res.json({ success: true, data: { meetings } });
});

// GET /api/meetings?from=&to= — broader agenda view (defaults to the next 30 days).
const listMeetings = catchAsync(async (req, res) => {
  const now = new Date();
  const from = req.query.from ? new Date(req.query.from) : startOfDay(now);
  const to = req.query.to ? new Date(req.query.to) : endOfDay(new Date(now.getTime() + 30 * 86400000));

  const meetings = await Meeting.findAll({
    where: { userId: req.user.id, startTime: { [Op.between]: [from, to] } },
    order: [['startTime', 'ASC']],
  });
  res.json({ success: true, data: { meetings } });
});

// POST /api/meetings
const createMeeting = catchAsync(async (req, res) => {
  const { title, startTime, endTime } = req.body;
  const meeting = await Meeting.create({ title, startTime, endTime: endTime || null, userId: req.user.id });
  res.status(201).json({ success: true, message: 'Meeting added.', data: { meeting } });
});

async function findOwnedMeeting(id, userId) {
  const meeting = await Meeting.findByPk(id);
  if (!meeting) throw ApiError.notFound('Meeting not found.');
  if (meeting.userId !== userId) throw ApiError.forbidden('This meeting belongs to someone else.');
  return meeting;
}

// PATCH /api/meetings/:id — also how the reminder toggle switch is flipped.
const updateMeeting = catchAsync(async (req, res) => {
  const meeting = await findOwnedMeeting(req.params.id, req.user.id);
  await meeting.update(req.body);
  res.json({ success: true, message: 'Meeting updated.', data: { meeting } });
});

// DELETE /api/meetings/:id
const deleteMeeting = catchAsync(async (req, res) => {
  const meeting = await findOwnedMeeting(req.params.id, req.user.id);
  await meeting.destroy();
  res.json({ success: true, message: 'Meeting removed.' });
});

module.exports = { listToday, listMeetings, createMeeting, updateMeeting, deleteMeeting };
