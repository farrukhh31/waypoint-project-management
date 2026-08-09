const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// An invite is how every account except the very first (bootstrap Admin) gets
// created. It stores a hash of the invite token, never the raw token — the
// raw value only ever exists in the link handed to the invitee (see
// utils/inviteToken.js), so a database leak can't be used to accept invites.
class Invite extends Model {
  get isExpired() {
    return this.status === 'PENDING' && this.expiresAt.getTime() < Date.now();
  }

  // Client-facing status that folds "expired" in as a derived state rather
  // than a stored one, so nothing needs to sweep the table on a timer.
  get effectiveStatus() {
    if (this.status === 'PENDING' && this.isExpired) return 'EXPIRED';
    return this.status;
  }

  toSafeJSON() {
    const { tokenHash, ...safe } = this.toJSON();
    return { ...safe, effectiveStatus: this.effectiveStatus };
  }
}

Invite.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'),
      allowNull: false,
      defaultValue: 'TEAM_MEMBER',
    },
    tokenHash: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REVOKED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    invitedById: { type: DataTypes.UUID, allowNull: false },
    // Set when a Project Manager sends the invite — scopes it to a single
    // project, and the invitee is auto-added as a member of that project
    // once they accept (see acceptInvite). Null for Admin-sent invites that
    // aren't tied to a specific project.
    projectId: { type: DataTypes.UUID, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    acceptedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Invite',
    tableName: 'invites',
    indexes: [{ fields: ['email'] }, { fields: ['status'] }],
  }
);

module.exports = Invite;