'use strict';

const NEW_TYPES = ['MEETING_INVITE', 'MEETING_REMINDER', 'MEETING_CANCELLED'];

const ALL_TYPES = [
  'TASK_ASSIGNED',
  'TASK_STATUS_CHANGED',
  'DISCUSSION_ADDED',
  'DEADLINE_APPROACHING',
  'PROJECT_ASSIGNED',
  'MEMBER_ADDED',
  'TASK_SUBMITTED',
  'TASK_APPROVED',
  'TASK_CHANGES_REQUESTED',
  'PROJECT_SUBMITTED',
  'PROJECT_APPROVED',
  'PROJECT_CHANGES_REQUESTED',
  ...NEW_TYPES,
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      for (const type of NEW_TYPES) {
        // eslint-disable-next-line no-await-in-loop
        await queryInterface.sequelize.query(
          `ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS '${type}';`
        );
      }
    } else {
      await queryInterface.changeColumn('notifications', 'type', {
        type: Sequelize.ENUM(...ALL_TYPES),
        allowNull: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      return; // not reversible — see the earlier review-notification-types migration
    }
    await queryInterface.changeColumn('notifications', 'type', {
      type: Sequelize.ENUM(
        'TASK_ASSIGNED',
        'TASK_STATUS_CHANGED',
        'DISCUSSION_ADDED',
        'DEADLINE_APPROACHING',
        'PROJECT_ASSIGNED',
        'MEMBER_ADDED',
        'TASK_SUBMITTED',
        'TASK_APPROVED',
        'TASK_CHANGES_REQUESTED',
        'PROJECT_SUBMITTED',
        'PROJECT_APPROVED',
        'PROJECT_CHANGES_REQUESTED'
      ),
      allowNull: false,
    });
  },
};
