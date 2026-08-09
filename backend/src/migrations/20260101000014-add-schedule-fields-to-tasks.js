'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'startDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('tasks', 'progress', {
      // 0-100, manual completion percentage independent of status —
      // lets the Gantt bar fill partially before a task flips to COMPLETED.
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('tasks', 'isMilestone', {
      // A zero-duration marker on the timeline (e.g. "Beta sign-off") —
      // rendered as a flag/diamond rather than a bar in the Gantt/Milestones views.
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addIndex('tasks', ['startDate']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', ['startDate']);
    await queryInterface.removeColumn('tasks', 'isMilestone');
    await queryInterface.removeColumn('tasks', 'progress');
    await queryInterface.removeColumn('tasks', 'startDate');
  },
};
