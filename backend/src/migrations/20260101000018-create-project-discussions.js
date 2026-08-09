'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_discussions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      projectId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
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
      message: { type: Sequelize.TEXT, allowNull: false },
      // Set when this comment was posted as part of a submit/review
      // decision (e.g. "Changes requested") rather than a free-form
      // comment, so the UI can style it distinctly.
      kind: {
        type: Sequelize.ENUM('COMMENT', 'SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED'),
        allowNull: false,
        defaultValue: 'COMMENT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('project_discussions', ['projectId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('project_discussions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_project_discussions_kind";').catch(() => {});
  },
};
