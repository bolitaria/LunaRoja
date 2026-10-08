'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_EmailTemplates_associatedEvent" ADD VALUE IF NOT EXISTS 'petition';`
    );
  },
  async down(queryInterface, Sequelize) {
    // Removing an enum value is not straightforward; leave empty.
  }
};
