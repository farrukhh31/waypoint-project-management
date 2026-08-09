const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ProjectDiscussion extends Model {}

ProjectDiscussion.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    // Structured extras a submission (or any comment) can carry alongside
    // the message: uploaded files (via POST /api/uploads) and external
    // links (Drive, GitHub, Figma, etc.) — see submitProject/reviewProject.
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
    modelName: 'ProjectDiscussion',
    tableName: 'project_discussions',
    indexes: [{ fields: ['projectId'] }],
  }
);

module.exports = ProjectDiscussion;
