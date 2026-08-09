'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('meetings', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      startTime: { type: Sequelize.DATE, allowNull: false },
      endTime: { type: Sequelize.DATE, allowNull: true },
      // The on/off toggle on each meeting row in the "Today's meetings"
      // widget — whether the user gets a reminder notification for it.
      reminderEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('meetings', ['userId']);
    await queryInterface.addIndex('meetings', ['userId', 'startTime']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('meetings');
  },
};
