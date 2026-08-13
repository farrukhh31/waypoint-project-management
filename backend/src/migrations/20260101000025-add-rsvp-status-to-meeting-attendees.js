'use strict';

// Attendees could already mute reminders per-meeting, but had no way to
// signal whether they're actually coming. This adds a per-attendee RSVP
// status (organizer included) so the Meetings card can show who's in,
// out, or still undecided at a glance.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('meeting_attendees', 'rsvpStatus', {
      type: Sequelize.ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE'),
      allowNull: false,
      defaultValue: 'PENDING',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('meeting_attendees', 'rsvpStatus');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_meeting_attendees_rsvpStatus";');
  },
};
