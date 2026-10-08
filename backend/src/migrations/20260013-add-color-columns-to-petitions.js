'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('petitions');
    if (!tableInfo.header_color) {
      await queryInterface.addColumn('petitions', 'header_color', { type: Sequelize.STRING(7), allowNull: true });
    }
    if (!tableInfo.button_color) {
      await queryInterface.addColumn('petitions', 'button_color', { type: Sequelize.STRING(7), allowNull: true });
    }
    if (!tableInfo.footer_color) {
      await queryInterface.addColumn('petitions', 'footer_color', { type: Sequelize.STRING(7), allowNull: true });
    }
    if (!tableInfo.background_color) {
      await queryInterface.addColumn('petitions', 'background_color', { type: Sequelize.STRING(7), allowNull: true });
    }
  },
  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('petitions');
    if (tableInfo.header_color) await queryInterface.removeColumn('petitions', 'header_color');
    if (tableInfo.button_color) await queryInterface.removeColumn('petitions', 'button_color');
    if (tableInfo.footer_color) await queryInterface.removeColumn('petitions', 'footer_color');
    if (tableInfo.background_color) await queryInterface.removeColumn('petitions', 'background_color');
  }
};
