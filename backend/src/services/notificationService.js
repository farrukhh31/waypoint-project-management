const { Notification, User } = require('../models');
const { sendMail } = require('./mailService');

let ioInstance = null;

// Called once from server.js after socket.io is initialized
function attachSocketServer(io) {
  ioInstance = io;
}

/**
 * Create a notification for a user and push it in real time if they're connected.
 * Honors that user's notification preferences: a muted type is skipped
 * entirely (no in-app row, no email), and an email copy only goes out if
 * they have email notifications turned on.
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.type - one of the NotificationType enum values
 * @param {string} opts.message
 * @param {string} [opts.link]
 */
async function notifyUser({ userId, type, message, link }) {
  const recipient = await User.findByPk(userId, {
    attributes: ['id', 'name', 'email', 'emailNotifications', 'mutedNotificationTypes'],
  });
  if (!recipient || recipient.mutedNotificationTypes.includes(type)) return null;

  const notification = await Notification.create({ userId, type, message, link });

  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notification:new', notification);
  }

  if (recipient.emailNotifications && recipient.email) {
    // Fire-and-forget — a slow/failed email should never block or fail the
    // in-app notification, which is the primary channel.
    sendMail({
      to: recipient.email,
      subject: 'New notification from Waypoint',
      text: message,
    }).catch((err) => console.error('[notificationService] email send failed:', err.message));
  }

  return notification;
}

/**
 * Notify multiple users at once (e.g. all project members).
 */
async function notifyUsers(userIds, payload) {
  const unique = [...new Set(userIds)];
  return Promise.all(unique.map((userId) => notifyUser({ ...payload, userId })));
}

module.exports = { attachSocketServer, notifyUser, notifyUsers };
