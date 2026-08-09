'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('task_discussions', 'kind', {
      // Distinguishes free-form comments from auto-posted submit/review
      // decisions ("Submitted for review", "Changes requested", etc.) so
      // the discussion thread can style them differently, like a real
      // issue tracker's activity log.
      type: Sequelize.ENUM('COMMENT', 'SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED'),
      allowNull: false,
      defaultValue: 'COMMENT',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('task_discussions', 'kind');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_task_discussions_kind";').catch(() => {});
  },
};
