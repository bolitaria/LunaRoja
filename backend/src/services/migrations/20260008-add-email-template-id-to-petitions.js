'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('petitions');
    if (!tableInfo.email_template_id) {
      await queryInterface.addColumn('petitions', 'email_template_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'EmailTemplates',   // ¡ahora apunta al nombre correcto!
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('petitions');
    if (tableInfo.email_template_id) {
      await queryInterface.removeColumn('petitions', 'email_template_id');
    }
  }
};
