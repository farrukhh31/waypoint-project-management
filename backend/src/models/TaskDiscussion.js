const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class TaskDiscussion extends Model {}

TaskDiscussion.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    taskId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    // Structured extras a submission (or any comment) can carry alongside
    // the message: uploaded files (via POST /api/uploads) and external
    // links (Drive, GitHub, Figma, etc.) — see submitTask/reviewTask.
    attachments: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    links: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    // COMMENT for free-form messages; the other three are auto-posted by
    // the submit/review endpoints so the thread doubles as an approval
    // history, the way a real issue tracker's activity log works.
    kind: {
      type: DataTypes.ENUM('COMMENT', 'SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED'),
      allowNull: false,
      defaultValue: 'COMMENT',
    },
  },
  {
    sequelize,
    modelName: 'TaskDiscussion',
    tableName: 'task_discussions',
    indexes: [{ fields: ['taskId'] }],
  }
);

module.exports = TaskDiscussion;
