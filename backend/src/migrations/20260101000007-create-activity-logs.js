'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      projectId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      taskId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      action: { type: Sequelize.STRING, allowNull: false },
      metadata: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('activity_logs', ['projectId']);
    await queryInterface.addIndex('activity_logs', ['taskId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('activity_logs');
  },
};
