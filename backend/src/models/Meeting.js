const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Meeting extends Model {}

Meeting.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: true },
    // Physical room, or a plain-text label like "Video call".
    location: { type: DataTypes.STRING, allowNull: true },
    // Zoom/Meet/Teams URL — rendered as a "Join meeting" button when present.
    meetingLink: { type: DataTypes.STRING, allowNull: true },
    // Optional accent used on the calendar (one of the app's design-token hues).
    color: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM('SCHEDULED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'SCHEDULED',
    },
    // The user who created/owns the meeting. Kept as `userId` at the DB
    // level (see migrations) but referred to as "organizer" everywhere in
    // application code — the organizer is always also an attendee.
    userId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Meeting',
    tableName: 'meetings',
    indexes: [{ fields: ['userId'] }, { fields: ['userId', 'startTime'] }, { fields: ['startTime'] }],
  }
);

module.exports = Meeting;
