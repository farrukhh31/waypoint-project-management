'use strict';

// Lets a comment or a submission carry structured file attachments
// ({ name, url, size, mimeType }, populated via POST /api/uploads) and
// external links ({ label, url }) — not just a text message. Primarily
// used on submit-for-review/approval, but available on any comment.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('task_discussions', 'attachments', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addColumn('task_discussions', 'links', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addColumn('project_discussions', 'attachments', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addColumn('project_discussions', 'links', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('task_discussions', 'attachments');
    await queryInterface.removeColumn('task_discussions', 'links');
    await queryInterface.removeColumn('project_discussions', 'attachments');
    await queryInterface.removeColumn('project_discussions', 'links');
  },
};
