const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class TimeEntry extends Model {}

TimeEntry.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    label: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM('RUNNING', 'PAUSED', 'STOPPED'),
      allowNull: false,
      defaultValue: 'RUNNING',
    },
    startedAt: { type: DataTypes.DATE, allowNull: false },
    lastResumedAt: { type: DataTypes.DATE, allowNull: true },
    accumulatedSeconds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    stoppedAt: { type: DataTypes.DATE, allowNull: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    projectId: { type: DataTypes.UUID, allowNull: true },
    taskId: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    modelName: 'TimeEntry',
    tableName: 'time_entries',
    indexes: [{ fields: ['userId'] }, { fields: ['userId', 'status'] }],
  }
);

module.exports = TimeEntry;
