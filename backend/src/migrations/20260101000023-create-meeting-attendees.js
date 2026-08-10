'use strict';

const crypto = require('crypto');

// Meetings move from "one row per user" to a real organizer + attendee-list
// shape: this table is the join between a meeting and everyone invited to
// it, each with their own reminder toggle (so one attendee muting reminders
// doesn't affect anyone else on the same meeting).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('meeting_attendees', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      meetingId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'meetings', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      reminderEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('meeting_attendees', ['userId']);
    await queryInterface.addIndex('meeting_attendees', ['meetingId']);
    await queryInterface.addIndex('meeting_attendees', ['meetingId', 'userId'], { unique: true });

    // Backfill: every meeting created before attendees existed had exactly
    // one implicit attendee — its owner (the old `userId` column, kept on
    // the meetings table and reused as `organizerId` in code).
    const [meetings] = await queryInterface.sequelize.query(
      'SELECT id, "userId", "reminderEnabled" FROM meetings'
    );
    if (meetings.length) {
      const now = new Date();
      await queryInterface.bulkInsert(
        'meeting_attendees',
        meetings.map((m) => ({
          id: crypto.randomUUID(),
          meetingId: m.id,
          userId: m.userId,
          reminderEnabled: m.reminderEnabled === undefined ? true : !!m.reminderEnabled,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('meeting_attendees');
  },
};
