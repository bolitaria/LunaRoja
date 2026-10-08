'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('ChatGroups');
    if (!tableInfo.bdsId) {
      await queryInterface.addColumn('ChatGroups', 'bdsId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'BDSs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
