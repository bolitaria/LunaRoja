'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('petitions');
    if (!tableInfo.title_color) {
      await queryInterface.addColumn('petitions', 'title_color', {
        type: Sequelize.STRING(7),
        allowNull: true,
        defaultValue: '#ffffff',
      });
    }
  },
  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('petitions');
    if (tableInfo.title_color) {
      await queryInterface.removeColumn('petitions', 'title_color');
    }
  }
};
