const { Op } = require('sequelize');
const { Meeting, MeetingAttendee, User } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { notifyUsers } = require('../services/notificationService');
const { paginationParams, paginationMeta, containsInsensitive } = require('../utils/queryHelpers');

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

const attendeeUserAttrs = ['id', 'name', 'email', 'avatarUrl', 'role', 'jobTitle'];

const meetingIncludes = [
  { model: User, as: 'organizer', attributes: attendeeUserAttrs },
  { model: User, as: 'attendees', attributes: attendeeUserAttrs, through: { attributes: ['reminderEnabled', 'rsvpStatus'] } },
];

// Reshapes a loaded Meeting so the frontend gets one flat `reminderEnabled`
// (this viewer's own attendee flag) alongside the full attendee list —
// rather than making every consumer dig through the join-table payload.
function present(meeting, viewerId) {
  const json = meeting.toJSON();
  const attendees = (json.attendees || []).map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    avatarUrl: a.avatarUrl,
    role: a.role,
    jobTitle: a.jobTitle,
    reminderEnabled: a.MeetingAttendee?.reminderEnabled ?? true,
    rsvpStatus: a.MeetingAttendee?.rsvpStatus ?? 'PENDING',
  }));
  const mine = attendees.find((a) => a.id === viewerId);
  return {
    id: json.id,
    title: json.title,
    description: json.description,
    startTime: json.startTime,
    endTime: json.endTime,
    location: json.location,
    meetingLink: json.meetingLink,
    color: json.color,
    status: json.status,
    organizer: json.organizer,
    attendees,
    reminderEnabled: mine ? mine.reminderEnabled : true,
    myRsvpStatus: mine ? mine.rsvpStatus : null,
    isAttendee: !!mine,
    isOrganizer: json.organizer?.id === viewerId,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
}

async function findMeetingsForUser(userId, where) {
  // Two-step on purpose: filtering the `attendees` association by userId
  // in the same include that's also supposed to return the *full* attendee
  // list would collapse that list down to just the matching row. So first
  // find which meetings this user is on, then load those with everything.
  const links = await MeetingAttendee.findAll({ where: { userId }, attributes: ['meetingId'] });
  const meetingIds = links.map((l) => l.meetingId);
  if (!meetingIds.length) return [];

  return Meeting.findAll({
    where: { ...where, id: meetingIds },
    include: meetingIncludes,
    order: [['startTime', 'ASC']],
  });
}

// GET /api/meetings/today
const listToday = catchAsync(async (req, res) => {
  const now = new Date();
  const meetings = await findMeetingsForUser(req.user.id, {
    startTime: { [Op.between]: [startOfDay(now), endOfDay(now)] },
    status: 'SCHEDULED',
  });
  res.json({ success: true, data: { meetings: meetings.map((m) => present(m, req.user.id)) } });
});

// GET /api/meetings?from=&to=&search= — agenda view (defaults to next 30 days).
const listMeetings = catchAsync(async (req, res) => {
  const now = new Date();
  const from = req.query.from ? new Date(req.query.from) : startOfDay(now);
  const to = req.query.to ? new Date(req.query.to) : endOfDay(new Date(now.getTime() + 30 * 86400000));

  const where = { startTime: { [Op.between]: [from, to] } };
  if (req.query.search) where.title = containsInsensitive(req.query.search);

  const meetings = await findMeetingsForUser(req.user.id, where);
  res.json({ success: true, data: { meetings: meetings.map((m) => present(m, req.user.id)) } });
});

// GET /api/meetings/upcoming?withinMinutes=120 — meetings starting soon, for
// the "starting soon" pulse/blink UI and the notification bell polling.
const listUpcoming = catchAsync(async (req, res) => {
  const withinMinutes = Math.min(Math.max(parseInt(req.query.withinMinutes, 10) || 120, 1), 1440);
  const now = new Date();
  const windowEnd = new Date(now.getTime() + withinMinutes * 60000);

  const meetings = await findMeetingsForUser(req.user.id, {
    startTime: { [Op.between]: [now, windowEnd] },
    status: 'SCHEDULED',
  });

  const shaped = meetings.map((m) => {
    const p = present(m, req.user.id);
    return {
      ...p,
      minutesUntil: Math.max(0, Math.round((new Date(p.startTime).getTime() - now.getTime()) / 60000)),
    };
  });

  res.json({ success: true, data: { meetings: shaped } });
});

// GET /api/meetings/:id
const getMeeting = catchAsync(async (req, res) => {
  const meeting = await Meeting.findByPk(req.params.id, { include: meetingIncludes });
  if (!meeting) throw ApiError.notFound('Meeting not found.');

  const isAttendee = meeting.attendees.some((a) => a.id === req.user.id);
  if (!isAttendee && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('You are not invited to this meeting.');
  }
  res.json({ success: true, data: { meeting: present(meeting, req.user.id) } });
});

// POST /api/meetings — organizer is always the creator; attendeeIds are
// everyone else invited (the organizer is added automatically).
const createMeeting = catchAsync(async (req, res) => {
  const { title, description, startTime, endTime, location, meetingLink, color, attendeeIds = [] } = req.body;

  const uniqueAttendeeIds = [...new Set([req.user.id, ...attendeeIds])];
  const validUsers = await User.findAll({ where: { id: uniqueAttendeeIds, isActive: true }, attributes: ['id'] });
  const validIds = validUsers.map((u) => u.id);
  if (!validIds.includes(req.user.id)) validIds.push(req.user.id);

  const meeting = await Meeting.create({
    title,
    description: description || null,
    startTime,
    endTime: endTime || null,
    location: location || null,
    meetingLink: meetingLink || null,
    color: color || null,
    userId: req.user.id,
  });

  await MeetingAttendee.bulkCreate(
    validIds.map((userId) => ({
      meetingId: meeting.id,
      userId,
      // The organizer scheduled it themselves, so they're accepted by
      // default — everyone else starts PENDING until they respond.
      rsvpStatus: userId === req.user.id ? 'ACCEPTED' : 'PENDING',
    }))
  );

  const others = validIds.filter((id) => id !== req.user.id);
  if (others.length) {
    notifyUsers(others, {
      type: 'MEETING_INVITE',
      message: `${req.user.name} invited you to "${title}".`,
      link: '/meetings',
    }).catch((err) => console.error('[meetingController] invite notify failed:', err.message));
  }

  const full = await Meeting.findByPk(meeting.id, { include: meetingIncludes });
  res
    .status(201)
    .json({ success: true, message: 'Meeting scheduled.', data: { meeting: present(full, req.user.id) } });
});

async function findMeetingWithAccess(id, user, { requireManage = false } = {}) {
  const meeting = await Meeting.findByPk(id, { include: meetingIncludes });
  if (!meeting) throw ApiError.notFound('Meeting not found.');

  const isOrganizer = meeting.userId === user.id;
  const isAttendee = meeting.attendees.some((a) => a.id === user.id);

  if (requireManage) {
    if (!isOrganizer && user.role !== 'ADMIN') {
      throw ApiError.forbidden('Only the organizer or an administrator can manage this meeting.');
    }
  } else if (!isAttendee && user.role !== 'ADMIN') {
    throw ApiError.forbidden('You are not invited to this meeting.');
  }
  return meeting;
}

// PATCH /api/meetings/:id — organizer or admin only. attendeeIds, if sent,
// fully replaces the attendee list (organizer is always kept).
const updateMeeting = catchAsync(async (req, res) => {
  const meeting = await findMeetingWithAccess(req.params.id, req.user, { requireManage: true });
  const { attendeeIds, ...fields } = req.body;

  await meeting.update(fields);

  if (Array.isArray(attendeeIds)) {
    const uniqueIds = [...new Set([meeting.userId, ...attendeeIds])];
    const validUsers = await User.findAll({ where: { id: uniqueIds, isActive: true }, attributes: ['id'] });
    const validIds = validUsers.map((u) => u.id);
    if (!validIds.includes(meeting.userId)) validIds.push(meeting.userId);

    const existingLinks = await MeetingAttendee.findAll({ where: { meetingId: meeting.id } });
    const existingIds = existingLinks.map((l) => l.userId);
    const toAdd = validIds.filter((id) => !existingIds.includes(id));
    const toRemove = existingIds.filter((id) => !validIds.includes(id));

    if (toAdd.length) await MeetingAttendee.bulkCreate(toAdd.map((userId) => ({ meetingId: meeting.id, userId })));
    if (toRemove.length) await MeetingAttendee.destroy({ where: { meetingId: meeting.id, userId: toRemove } });

    if (toAdd.length) {
      notifyUsers(toAdd.filter((id) => id !== req.user.id), {
        type: 'MEETING_INVITE',
        message: `${req.user.name} invited you to "${meeting.title}".`,
        link: '/meetings',
      }).catch((err) => console.error('[meetingController] invite notify failed:', err.message));
    }
  }

  const full = await Meeting.findByPk(meeting.id, { include: meetingIncludes });
  res.json({ success: true, message: 'Meeting updated.', data: { meeting: present(full, req.user.id) } });
});

// PATCH /api/meetings/:id/reminder — self-service, any attendee toggles
// their own reminder without needing organizer/admin rights.
const toggleReminder = catchAsync(async (req, res) => {
  const link = await MeetingAttendee.findOne({ where: { meetingId: req.params.id, userId: req.user.id } });
  if (!link) throw ApiError.notFound('You are not an attendee of this meeting.');

  link.reminderEnabled = req.body.reminderEnabled ?? !link.reminderEnabled;
  await link.save();

  res.json({
    success: true,
    message: 'Reminder preference updated.',
    data: { reminderEnabled: link.reminderEnabled },
  });
});

// PATCH /api/meetings/:id/rsvp — self-service, any attendee (including the
// organizer) sets their own attendance status. No manage rights required.
const setRsvp = catchAsync(async (req, res) => {
  const link = await MeetingAttendee.findOne({ where: { meetingId: req.params.id, userId: req.user.id } });
  if (!link) throw ApiError.notFound('You are not an attendee of this meeting.');

  link.rsvpStatus = req.body.rsvpStatus;
  await link.save();

  res.json({ success: true, message: 'RSVP updated.', data: { rsvpStatus: link.rsvpStatus } });
});

// DELETE /api/meetings/:id — organizer or admin; notifies remaining attendees.
const deleteMeeting = catchAsync(async (req, res) => {
  const meeting = await findMeetingWithAccess(req.params.id, req.user, { requireManage: true });
  const otherAttendeeIds = meeting.attendees.map((a) => a.id).filter((id) => id !== req.user.id);
  const title = meeting.title;

  await meeting.destroy();

  if (otherAttendeeIds.length) {
    notifyUsers(otherAttendeeIds, {
      type: 'MEETING_CANCELLED',
      message: `"${title}" was cancelled.`,
      link: '/meetings',
    }).catch((err) => console.error('[meetingController] cancel notify failed:', err.message));
  }

  res.json({ success: true, message: 'Meeting removed.' });
});

// GET /api/meetings/admin/all?search=&organizerId=&from=&to=&page=&limit=
// Admin-only, organization-wide meeting management list.
const listAllMeetings = catchAsync(async (req, res) => {
  const { search, organizerId, from, to, page, limit } = req.query;
  const { limit: limitNum, offset, page: pageNum } = paginationParams(page, limit, { defaultLimit: 15 });

  const where = {};
  if (search) where.title = containsInsensitive(search);
  if (organizerId) where.userId = organizerId;
  if (from || to) {
    where.startTime = {};
    if (from) where.startTime[Op.gte] = new Date(from);
    if (to) where.startTime[Op.lte] = new Date(to);
  }

  const { rows, count } = await Meeting.findAndCountAll({
    where,
    include: meetingIncludes,
    order: [['startTime', 'DESC']],
    limit: limitNum,
    offset,
    distinct: true,
  });

  res.json({
    success: true,
    data: {
      meetings: rows.map((m) => present(m, req.user.id)),
      pagination: paginationMeta(pageNum, limitNum, count),
    },
  });
});

module.exports = {
  listToday,
  listMeetings,
  listUpcoming,
  getMeeting,
  createMeeting,
  updateMeeting,
  toggleReminder,
  setRsvp,
  deleteMeeting,
  listAllMeetings,
};
