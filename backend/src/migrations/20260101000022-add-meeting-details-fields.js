'use strict';

// Extends meetings with the fields a real meeting needs beyond a bare
// title/time: what it's about, where it happens (room or video link), and
// an optional color tag used by the calendar UI.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('meetings', 'description', { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn('meetings', 'location', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('meetings', 'meetingLink', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('meetings', 'color', { type: Sequelize.STRING, allowNull: true });
    // STOPPED-equivalent state for meetings: lets an organizer cancel a
    // meeting without deleting its history.
    await queryInterface.addColumn('meetings', 'status', {
      type: Sequelize.ENUM('SCHEDULED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'SCHEDULED',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('meetings', 'description');
    await queryInterface.removeColumn('meetings', 'location');
    await queryInterface.removeColumn('meetings', 'meetingLink');
    await queryInterface.removeColumn('meetings', 'color');
    await queryInterface.removeColumn('meetings', 'status');
  },
};
