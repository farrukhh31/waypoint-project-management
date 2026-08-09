'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('projects', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      startDate: { type: Sequelize.DATE, allowNull: false },
      endDate: { type: Sequelize.DATE, allowNull: false },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
        defaultValue: 'MEDIUM',
      },
      status: {
        type: Sequelize.ENUM('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PLANNED',
      },
      managerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('projects', ['managerId']);
    await queryInterface.addIndex('projects', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('projects');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_projects_priority";').catch(() => {});
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_projects_status";').catch(() => {});
  },
};
