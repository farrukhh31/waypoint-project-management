'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('time_entries', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      label: { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM('RUNNING', 'PAUSED', 'STOPPED'),
        allowNull: false,
        defaultValue: 'RUNNING',
      },
      // Wall-clock timestamp the entry was first created — kept for display
      // ("started at 2:04 PM") even though elapsed time is computed from
      // accumulatedSeconds + the current running segment, not from this.
      startedAt: { type: Sequelize.DATE, allowNull: false },
      // Timestamp the current RUNNING segment began; null while paused/stopped.
      lastResumedAt: { type: Sequelize.DATE, allowNull: true },
      // Seconds banked from all previous segments (before the current
      // running one, if any). elapsed = accumulatedSeconds [+ now - lastResumedAt].
      accumulatedSeconds: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      stoppedAt: { type: Sequelize.DATE, allowNull: true },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      projectId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'projects', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      taskId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('time_entries', ['userId']);
    await queryInterface.addIndex('time_entries', ['userId', 'status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('time_entries');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_time_entries_status";').catch(() => {});
  },
};
