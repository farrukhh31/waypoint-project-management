'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'twoFactorEnabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('users', 'twoFactorSecret', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'twoFactorBackupCodes', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '[]',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'twoFactorEnabled');
    await queryInterface.removeColumn('users', 'twoFactorSecret');
    await queryInterface.removeColumn('users', 'twoFactorBackupCodes');
  },
};
