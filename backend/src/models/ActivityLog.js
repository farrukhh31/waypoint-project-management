const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ActivityLog extends Model {}

ActivityLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: true },
    taskId: { type: DataTypes.UUID, allowNull: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      // Stored as a JSON string (see activityService.logActivity); parse it
      // back out on the way out so consumers (activity feeds/reports) get
      // a real object instead of having to JSON.parse it themselves.
      get() {
        const raw = this.getDataValue('metadata');
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      },
    },
  },
  {
    sequelize,
    modelName: 'ActivityLog',
    tableName: 'activity_logs',
    indexes: [{ fields: ['projectId'] }, { fields: ['taskId'] }],
  }
);

module.exports = ActivityLog;
