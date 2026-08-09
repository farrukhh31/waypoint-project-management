'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasks', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
        defaultValue: 'MEDIUM',
      },
      status: {
        type: Sequelize.ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'TODO',
      },
      dueDate: { type: Sequelize.DATE, allowNull: false },
      projectId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      assigneeId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      creatorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('tasks', ['projectId']);
    await queryInterface.addIndex('tasks', ['assigneeId']);
    await queryInterface.addIndex('tasks', ['status']);
    await queryInterface.addIndex('tasks', ['dueDate']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tasks');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_priority";').catch(() => {});
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_status";').catch(() => {});
  },
};
