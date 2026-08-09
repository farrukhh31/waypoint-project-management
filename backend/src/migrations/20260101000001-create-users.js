'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      passwordHash: { type: Sequelize.STRING, allowNull: false },
      role: {
        type: Sequelize.ENUM('ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'),
        allowNull: false,
        defaultValue: 'TEAM_MEMBER',
      },
      avatarUrl: { type: Sequelize.STRING, allowNull: true },
      jobTitle: { type: Sequelize.STRING, allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('users', ['role']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
    // Postgres leaves the ENUM type behind after dropTable; clean it up explicitly.
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";').catch(() => {});
  },
};
