'use strict';

// Adds a PENDING_APPROVAL status to projects.status — the state a project
// sits in after the Project Manager submits it for completion and before
// an Administrator approves it (-> COMPLETED) or sends it back with
// requested changes (-> ACTIVE).
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      // Postgres enums need an explicit ADD VALUE; this must run outside
      // any other DDL in the same transaction, which is fine since this
      // migration only does this one thing.
      await queryInterface.sequelize.query(
        "ALTER TYPE \"enum_projects_status\" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';"
      );
    } else {
      // SQLite has no real enum type — Sequelize just validates at the
      // JS layer — so rewriting the column definition is enough to keep
      // model <-> migration definitions in sync.
      await queryInterface.changeColumn('projects', 'status', {
        type: Sequelize.ENUM('PLANNED', 'ACTIVE', 'ON_HOLD', 'PENDING_APPROVAL', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PLANNED',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      // Postgres does not support removing a single enum value; reverting
      // this would require rebuilding the type and column entirely. Left
      // as a no-op — acceptable for a purely additive status value.
      return;
    }
    await queryInterface.changeColumn('projects', 'status', {
      type: Sequelize.ENUM('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PLANNED',
    });
  },
};
