const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ProjectMember extends Model {}

ProjectMember.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    sequelize,
    modelName: 'ProjectMember',
    tableName: 'project_members',
    indexes: [{ unique: true, fields: ['projectId', 'userId'] }, { fields: ['userId'] }],
  }
);

module.exports = ProjectMember;
