const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// Join row between a Meeting and one of its invited users. Carries a
// per-attendee reminderEnabled flag so muting reminders on a meeting only
// ever affects the person who muted them.
class MeetingAttendee extends Model {}

MeetingAttendee.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    meetingId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    reminderEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'MeetingAttendee',
    tableName: 'meeting_attendees',
    indexes: [{ fields: ['userId'] }, { fields: ['meetingId'] }, { unique: true, fields: ['meetingId', 'userId'] }],
  }
);

module.exports = MeetingAttendee;
