'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "public"."enum_links_category" ADD VALUE IF NOT EXISTS 'bibliografia';`
    );
  },

  async down(queryInterface, Sequelize) {
    // No se puede eliminar un valor de un enum en PostgreSQL fácilmente, se deja vacío.
  }
};
