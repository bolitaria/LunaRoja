'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('petitions');
    if (!tableInfo.footer_title_color) {
      await queryInterface.addColumn('petitions', 'footer_title_color', {
        type: Sequelize.STRING(7),
        allowNull: true,
        defaultValue: '#ffffff',
      });
    }
  },
  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('petitions');
    if (tableInfo.footer_title_color) {
      await queryInterface.removeColumn('petitions', 'footer_title_color');
    }
  }
};
