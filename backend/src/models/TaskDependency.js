const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// Edge: `taskId` depends on `dependsOnTaskId` (the latter must finish
// first). Powers the Gantt view's connector lines.
class TaskDependency extends Model {}

TaskDependency.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    taskId: { type: DataTypes.UUID, allowNull: false },
    dependsOnTaskId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    sequelize,
    modelName: 'TaskDependency',
    tableName: 'task_dependencies',
    indexes: [
      { fields: ['taskId'] },
      { fields: ['dependsOnTaskId'] },
      { fields: ['taskId', 'dependsOnTaskId'], unique: true },
    ],
  }
);

module.exports = TaskDependency;
