'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_links_category ADD VALUE IF NOT EXISTS 'general';
    `);
  },
  down: async (queryInterface, Sequelize) => {
    console.log('Down migration for links enum not fully supported – manual intervention may be needed.');
  },
};
