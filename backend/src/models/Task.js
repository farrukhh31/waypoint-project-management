const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Task extends Model {}

Task.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      allowNull: false,
      defaultValue: 'MEDIUM',
    },
    status: {
      type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'),
      allowNull: false,
      defaultValue: 'TODO',
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: false },
    progress: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isMilestone: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    projectId: { type: DataTypes.UUID, allowNull: false },
    assigneeId: { type: DataTypes.UUID, allowNull: true },
    creatorId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    indexes: [
      { fields: ['projectId'] },
      { fields: ['assigneeId'] },
      { fields: ['status'] },
      { fields: ['startDate'] },
    ],
  }
);

module.exports = Task;
