const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Notification extends Model {}

Notification.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        'TASK_ASSIGNED',
        'TASK_STATUS_CHANGED',
        'DISCUSSION_ADDED',
        'DEADLINE_APPROACHING',
        'PROJECT_ASSIGNED',
        'MEMBER_ADDED',
        'TASK_SUBMITTED',
        'TASK_APPROVED',
        'TASK_CHANGES_REQUESTED',
        'PROJECT_SUBMITTED',
        'PROJECT_APPROVED',
        'PROJECT_CHANGES_REQUESTED',
        'MEETING_INVITE',
        'MEETING_REMINDER',
        'MEETING_CANCELLED'
      ),
      allowNull: false,
    },
    message: { type: DataTypes.STRING, allowNull: false },
    link: { type: DataTypes.STRING, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    indexes: [{ fields: ['userId', 'isRead'] }],
  }
);

module.exports = Notification;
