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
    // Whether this attendee is actually coming — organizer included, so a
    // meeting's own creator shows up in the same head-count as everyone else.
    rsvpStatus: {
      type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
  },
  {
    sequelize,
    modelName: 'MeetingAttendee',
    tableName: 'meeting_attendees',
    indexes: [{ fields: ['userId'] }, { fields: ['meetingId'] }, { unique: true, fields: ['meetingId', 'userId'] }],
  }
);

module.exports = MeetingAttendee;
