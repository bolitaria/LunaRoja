'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('petitions');
    if (!tableInfo.email_subject) {
      await queryInterface.addColumn('petitions', 'email_subject', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
  },
  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('petitions');
    if (tableInfo.email_subject) {
      await queryInterface.removeColumn('petitions', 'email_subject');
    }
  }
};
