'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM(
          'TASK_ASSIGNED',
          'TASK_STATUS_CHANGED',
          'DISCUSSION_ADDED',
          'DEADLINE_APPROACHING',
          'PROJECT_ASSIGNED',
          'MEMBER_ADDED'
        ),
        allowNull: false,
      },
      message: { type: Sequelize.STRING, allowNull: false },
      link: { type: Sequelize.STRING, allowNull: true },
      isRead: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('notifications', ['userId', 'isRead']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";').catch(() => {});
  },
};
