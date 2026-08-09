const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RefreshToken extends Model {}

RefreshToken.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    token: { type: DataTypes.STRING, allowNull: false, unique: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    indexes: [{ fields: ['userId'] }],
  }
);

module.exports = RefreshToken;
