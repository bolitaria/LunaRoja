'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Users
    await queryInterface.createTable('Users', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      role: { type: Sequelize.ENUM('superadmin','campaign_admin','action_admin','bds_admin','blog_admin','user'), defaultValue: 'user' },
      refreshToken: { type: Sequelize.STRING },
      resetToken: { type: Sequelize.STRING },
      resetTokenExpires: { type: Sequelize.DATE },
      lastLogin: { type: Sequelize.DATE },
      failedLoginAttempts: { type: Sequelize.INTEGER, defaultValue: 0 },
      lockedUntil: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Campaigns
    await queryInterface.createTable('Campaigns', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      color: { type: Sequelize.STRING },
      imageUrl: { type: Sequelize.STRING },
      groups: { type: Sequelize.JSON },
      documentLink: { type: Sequelize.STRING },
      document: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // BDSs (observa que el down usa 'BDs', pero el modelo se llama BDSs)
    await queryInterface.createTable('BDSs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      color: { type: Sequelize.STRING },
      imageUrl: { type: Sequelize.STRING },
      groups: { type: Sequelize.JSON },
      documentLink: { type: Sequelize.STRING },
      document: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Actions
    await queryInterface.createTable('Actions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      category: { type: Sequelize.ENUM('webinar','talk','protest','bds','strike','march','solidarity_action','workshop'), defaultValue: 'protest' },
      datetime: { type: Sequelize.DATE, allowNull: false },
      locationType: { type: Sequelize.ENUM('online','presencial'), defaultValue: 'online' },
      onlineLink: { type: Sequelize.STRING },
      placeName: { type: Sequelize.STRING },
      address: { type: Sequelize.STRING },
      latitude: { type: Sequelize.FLOAT },
      longitude: { type: Sequelize.FLOAT },
      registrationLink: { type: Sequelize.STRING },
      recordingUrl: { type: Sequelize.STRING },
      campaignId: { type: Sequelize.INTEGER, references: { model: 'Campaigns', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      bdsId: { type: Sequelize.INTEGER, references: { model: 'BDSs', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      featuredImage: { type: Sequelize.STRING },
      groups: { type: Sequelize.JSON },
      documentLink: { type: Sequelize.STRING },
      document: { type: Sequelize.STRING },
      urgent: { type: Sequelize.BOOLEAN, defaultValue: false },
      enableAttendance: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // ActionImages
    await queryInterface.createTable('ActionImages', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      url: { type: Sequelize.STRING, allowNull: false },
      order: { type: Sequelize.INTEGER, defaultValue: 0 },
      actionId: { type: Sequelize.INTEGER, references: { model: 'Actions', key: 'id' }, onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // UserCampaigns
    await queryInterface.createTable('UserCampaigns', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: Sequelize.INTEGER, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      campaignId: { type: Sequelize.INTEGER, references: { model: 'Campaigns', key: 'id' }, onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // UserActions
    await queryInterface.createTable('UserActions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: Sequelize.INTEGER, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      actionId: { type: Sequelize.INTEGER, references: { model: 'Actions', key: 'id' }, onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // UserBDS
    await queryInterface.createTable('UserBDS', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: Sequelize.INTEGER, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      bdsId: { type: Sequelize.INTEGER, references: { model: 'BDSs', key: 'id' }, onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Subscribers
    await queryInterface.createTable('Subscribers', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      status: { type: Sequelize.STRING, defaultValue: 'active' },
      sendReminders: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // SubscribersReminders
    await queryInterface.createTable('SubscribersReminders', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      actionId: { type: Sequelize.INTEGER, references: { model: 'Actions', key: 'id' }, onDelete: 'CASCADE' },
      subscriberId: { type: Sequelize.INTEGER, references: { model: 'Subscribers', key: 'id' }, onDelete: 'CASCADE' },
      scheduledAt: { type: Sequelize.DATE, allowNull: false },
      sent: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // ChatGroups
    await queryInterface.createTable('ChatGroups', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      platform: { type: Sequelize.ENUM('telegram','whatsapp','signal'), allowNull: false },
      link: { type: Sequelize.STRING, allowNull: false },
      region: { type: Sequelize.STRING },
      campaignId: { type: Sequelize.INTEGER, references: { model: 'Campaigns', key: 'id' }, onDelete: 'SET NULL' },
      actionId: { type: Sequelize.INTEGER, references: { model: 'Actions', key: 'id' }, onDelete: 'SET NULL' },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      isPublic: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // News
    await queryInterface.createTable('News', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT },
      campaignId: { type: Sequelize.INTEGER, references: { model: 'Campaigns', key: 'id' }, onDelete: 'SET NULL' },
      actionId: { type: Sequelize.INTEGER, references: { model: 'Actions', key: 'id' }, onDelete: 'SET NULL' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // EmailTemplates
    await queryInterface.createTable('EmailTemplates', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      subject: { type: Sequelize.STRING },
      body: { type: Sequelize.TEXT },
      type: { type: Sequelize.STRING },
      associatedEvent: { type: Sequelize.STRING },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      headerColor: { type: Sequelize.STRING },
      buttonColor: { type: Sequelize.STRING },
      footerColor: { type: Sequelize.STRING },
      backgroundColor: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // petitions
    await queryInterface.createTable('petitions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      created_by: { type: Sequelize.INTEGER, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
      emailTemplateId: { type: Sequelize.INTEGER, references: { model: 'EmailTemplates', key: 'id' }, onDelete: 'SET NULL' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // signature_hashes
    await queryInterface.createTable('signature_hashes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      hash: { type: Sequelize.STRING, allowNull: false },
      petition_id: { type: Sequelize.INTEGER, references: { model: 'petitions', key: 'id' }, onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // email_queue
    await queryInterface.createTable('email_queue', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      petition_id: { type: Sequelize.INTEGER, references: { model: 'petitions', key: 'id' }, onDelete: 'CASCADE' },
      subscriberId: { type: Sequelize.INTEGER, references: { model: 'Subscribers', key: 'id' }, onDelete: 'CASCADE' },
      sent: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // email_quota
    await queryInterface.createTable('email_quota', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      count: { type: Sequelize.INTEGER, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Reports
    await queryInterface.createTable('Reports', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // links
    await queryInterface.createTable('links', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      url: { type: Sequelize.STRING, allowNull: false },
      created_by: { type: Sequelize.INTEGER, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('links');
    await queryInterface.dropTable('Reports');
    await queryInterface.dropTable('email_quota');
    await queryInterface.dropTable('email_queue');
    await queryInterface.dropTable('signature_hashes');
    await queryInterface.dropTable('petitions');
    await queryInterface.dropTable('EmailTemplates');
    await queryInterface.dropTable('News');
    await queryInterface.dropTable('ChatGroups');
    await queryInterface.dropTable('SubscribersReminders');
    await queryInterface.dropTable('Subscribers');
    await queryInterface.dropTable('UserBDS');
    await queryInterface.dropTable('UserActions');
    await queryInterface.dropTable('UserCampaigns');
    await queryInterface.dropTable('ActionImages');
    await queryInterface.dropTable('Actions');
    await queryInterface.dropTable('BDSs');
    await queryInterface.dropTable('Campaigns');
    await queryInterface.dropTable('Users');
  },
};