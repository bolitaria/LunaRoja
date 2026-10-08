'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('ChatGroups');
    if (!tableInfo.bdsId) {
      await queryInterface.addColumn('ChatGroups', 'bdsId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        // Sin REFERENCES para no depender de la tabla BDSs
      });
    }
  },
  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('ChatGroups');
    if (tableInfo.bdsId) {
      await queryInterface.removeColumn('ChatGroups', 'bdsId');
    }
  }
};
