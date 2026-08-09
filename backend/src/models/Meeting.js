const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Meeting extends Model {}

Meeting.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: true },
    reminderEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    userId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Meeting',
    tableName: 'meetings',
    indexes: [{ fields: ['userId'] }, { fields: ['userId', 'startTime'] }],
  }
);

module.exports = Meeting;
