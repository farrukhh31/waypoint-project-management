'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'emailNotifications', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    // Stored as a JSON-stringified array of NotificationType values the user
    // has muted (see Notification model for the enum). TEXT rather than a
    // native JSON/array column so this works identically on SQLite (dev)
    // and Postgres (prod) — see ActivityLog.metadata for the same pattern.
    await queryInterface.addColumn('users', 'mutedNotificationTypes', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '[]',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'emailNotifications');
    await queryInterface.removeColumn('users', 'mutedNotificationTypes');
  },
};
