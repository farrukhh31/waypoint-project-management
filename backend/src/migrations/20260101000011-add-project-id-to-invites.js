'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('invites', 'projectId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'projects', key: 'id' },
      onDelete: 'CASCADE',
    });
    await queryInterface.addIndex('invites', ['projectId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('invites', ['projectId']);
    await queryInterface.removeColumn('invites', 'projectId');
  },
};
