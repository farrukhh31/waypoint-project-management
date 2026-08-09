const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Project extends Model {}

Project.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      allowNull: false,
      defaultValue: 'MEDIUM',
    },
    status: {
      // PENDING_APPROVAL sits between ACTIVE and COMPLETED: the Project
      // Manager submits the project once all tasks are done, and only an
      // Administrator can move it out of that state (approve -> COMPLETED,
      // or request changes -> back to ACTIVE).
      type: DataTypes.ENUM('PLANNED', 'ACTIVE', 'ON_HOLD', 'PENDING_APPROVAL', 'COMPLETED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PLANNED',
    },
    managerId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
    indexes: [{ fields: ['managerId'] }, { fields: ['status'] }],
  }
);

module.exports = Project;
