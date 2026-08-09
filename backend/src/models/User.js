const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {
  toSafeJSON() {
    const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...safe } = this.toJSON();
    return safe;
  }
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'),
      allowNull: false,
      defaultValue: 'TEAM_MEMBER',
    },
    avatarUrl: { type: DataTypes.STRING, allowNull: true },
    jobTitle: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    linkedinUrl: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    // Admin-controlled, per-user toggle. Only meaningful for PROJECT_MANAGER
    // accounts: when true, that PM may invite TEAM_MEMBERs into projects they
    // manage (see inviteController). Ignored for ADMIN (always allowed) and
    // TEAM_MEMBER (never allowed) roles.
    canInviteMembers: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    // Master switch: when true, notifyUser() also emails a copy of each
    // notification (see notificationService). Defaults on so existing users
    // keep current behavior after migration.
    emailNotifications: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    // Per-type opt-out — a JSON-stringified array of NotificationType values
    // this user doesn't want to be notified about at all (no in-app row, no
    // email). Parsed to/from a real array so consumers don't juggle JSON.
    mutedNotificationTypes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('mutedNotificationTypes');
        if (!raw) return [];
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      },
      set(value) {
        this.setDataValue('mutedNotificationTypes', JSON.stringify(Array.isArray(value) ? value : []));
      },
    },
    // Two-factor authentication (TOTP, RFC 6238). twoFactorSecret is the
    // base32 shared secret — set during setup, only "live" once
    // twoFactorEnabled flips true (see userController.enableTwoFactor).
    // Never exposed via toSafeJSON.
    twoFactorEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    twoFactorSecret: { type: DataTypes.STRING, allowNull: true },
    // One-time recovery codes for when the authenticator app is unavailable —
    // stored as bcrypt hashes (never plaintext), consumed (removed) on use.
    // Plaintext codes are only ever shown once, at generation time.
    twoFactorBackupCodes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('twoFactorBackupCodes');
        if (!raw) return [];
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      },
      set(value) {
        this.setDataValue('twoFactorBackupCodes', JSON.stringify(Array.isArray(value) ? value : []));
      },
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [{ fields: ['role'] }],
  }
);

module.exports = User;