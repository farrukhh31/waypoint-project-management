'use strict';


const AVATAR_BASE = 'https://i.pravatar.cc/300';

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query(
      'SELECT id, email FROM users WHERE "avatarUrl" IS NULL;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const user of users) {
      const url = `${AVATAR_BASE}?u=${encodeURIComponent(user.email)}`;
      await queryInterface.sequelize.query(
        'UPDATE users SET "avatarUrl" = :url WHERE id = :id;',
        { replacements: { url, id: user.id } }
      );
    }
  },

  async down() {
    // Backfill is one-directional — we don't know which rows were NULL
    // before, so there's nothing meaningful to revert.
  },
};