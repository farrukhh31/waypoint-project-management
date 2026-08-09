'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invites', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false },
      role: {
        type: Sequelize.ENUM('ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'),
        allowNull: false,
        defaultValue: 'TEAM_MEMBER',
      },
      tokenHash: { type: Sequelize.STRING, allowNull: false, unique: true },
      status: {
        type: Sequelize.ENUM('PENDING', 'ACCEPTED', 'REVOKED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      invitedById: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      acceptedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('invites', ['email']);
    await queryInterface.addIndex('invites', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('invites');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invites_role";').catch(() => {});
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invites_status";').catch(() => {});
  },
};
