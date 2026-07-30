'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EmailTemplates', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      variables: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      type: {
        type: Sequelize.ENUM('system', 'custom'),
        defaultValue: 'custom',
      },
      associatedEvent: {
        type: Sequelize.ENUM('campaign_created', 'action_created', 'subscriber_welcome', 'reminder', 'custom'),
        defaultValue: 'custom',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      headerColor: {
        type: Sequelize.STRING(7),
        defaultValue: '#b91c1c',
      },
      buttonColor: {
        type: Sequelize.STRING(7),
        defaultValue: '#16a34a',
      },
      footerColor: {
        type: Sequelize.STRING(7),
        defaultValue: '#1f2937',
      },
      backgroundColor: {
        type: Sequelize.STRING(7),
        defaultValue: '#f3f4f6',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('EmailTemplates');
  }
};
