'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('petitions', 'email_body_template');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('petitions', 'email_body_template', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  }
};
