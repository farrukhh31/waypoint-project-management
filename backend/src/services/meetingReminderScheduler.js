const { Op } = require('sequelize');
const { Meeting, MeetingAttendee, Notification } = require('../models');
const { notifyUser } = require('./notificationService');

const CHECK_INTERVAL_MS = 60 * 1000; // every minute — meetings need timelier alerts than daily deadlines
const REMINDER_WINDOW_MINUTES = 15;

// Finds meetings starting within the next REMINDER_WINDOW_MINUTES and pings
// every attendee who still has reminders on for it, skipping anyone already
// reminded about this specific meeting recently.
async function checkUpcomingMeetings() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000);

  const meetings = await Meeting.findAll({
    where: { startTime: { [Op.between]: [now, windowEnd] }, status: 'SCHEDULED' },
    include: [{ model: MeetingAttendee, as: 'attendeeLinks', where: { reminderEnabled: true }, required: false }],
  });

  for (const meeting of meetings) {
    const attendeeLinks = meeting.attendeeLinks || [];
    const minutesUntil = Math.max(1, Math.round((new Date(meeting.startTime).getTime() - now.getTime()) / 60000));
    const link = `/meetings?highlight=${meeting.id}`;

    for (const attendeeLink of attendeeLinks) {
      // Dedupe per meeting (not per exact message — minutesUntil changes
      // every run within the window, so matching on `link` instead of the
      // full message is what actually prevents repeat pings).
      // eslint-disable-next-line no-await-in-loop
      const recentDupe = await Notification.findOne({
        where: {
          userId: attendeeLink.userId,
          type: 'MEETING_REMINDER',
          link,
          createdAt: { [Op.gte]: new Date(now.getTime() - REMINDER_WINDOW_MINUTES * 60 * 1000) },
        },
      });
      if (recentDupe) continue;

      // eslint-disable-next-line no-await-in-loop
      await notifyUser({
        userId: attendeeLink.userId,
        type: 'MEETING_REMINDER',
        message: `"${meeting.title}" starts in ${minutesUntil} minute${minutesUntil === 1 ? '' : 's'}.`,
        link,
      });
    }
  }
}

function startMeetingReminderScheduler() {
  setTimeout(checkUpcomingMeetings, 5 * 1000);
  setInterval(checkUpcomingMeetings, CHECK_INTERVAL_MS);
}

module.exports = { startMeetingReminderScheduler, checkUpcomingMeetings };
