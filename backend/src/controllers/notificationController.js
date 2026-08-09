const { Notification } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const listNotifications = catchAsync(async (req, res) => {
  const { isRead, limit = 50 } = req.query;
  const where = { userId: req.user.id };
  if (isRead !== undefined) where.isRead = isRead === 'true';

  const notifications = await Notification.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: Math.min(parseInt(limit, 10) || 50, 200),
  });

  const unreadCount = await Notification.count({ where: { userId: req.user.id, isRead: false } });

  res.json({ success: true, data: { notifications, unreadCount } });
});

const markAsRead = catchAsync(async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification || notification.userId !== req.user.id) {
    throw ApiError.notFound('Notification not found.');
  }
  notification.isRead = true;
  await notification.save();
  res.json({ success: true, data: { notification } });
});

const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

module.exports = { listNotifications, markAsRead, markAllAsRead };
