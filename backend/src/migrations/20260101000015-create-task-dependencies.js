'use strict';

// Self-referencing edges for the Gantt view: "taskId depends on
// dependsOnTaskId" (i.e. dependsOnTaskId must finish before taskId
// can start). Kept as its own table rather than an ENUM/array column
// so the Gantt can draw connector lines and later support blocking
// validation without a schema change.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('task_dependencies', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      taskId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      dependsOnTaskId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('task_dependencies', ['taskId']);
    await queryInterface.addIndex('task_dependencies', ['dependsOnTaskId']);
    await queryInterface.addIndex('task_dependencies', ['taskId', 'dependsOnTaskId'], {
      unique: true,
      name: 'task_dependencies_unique_edge',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('task_dependencies');
  },
};
