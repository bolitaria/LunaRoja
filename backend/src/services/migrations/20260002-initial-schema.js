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

    // BDs
    await queryInterface.createTable('BDs', {
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
      bdsId: { type: Sequelize.INTEGER, references: { model: 'BDs', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
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
      bdsId: { type: Sequelize.INTEGER, references: { model: 'BDs', key: 'id' }, onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Subscribers
    await queryInterface.createTable('Subscribers', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      status: { type: Sequelize.STRING, defaultValue: 'active' },
      sendReminders: { type: Sequelize.BOOLEAN, defaultValue: true },
      subscribedAt: { type: Sequelize.DATE },
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
      description: { type: Sequelize.TEXT },
      youtubeUrl: { type: Sequelize.STRING },
      thumbnail: { type: Sequelize.STRING },
      publishedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      isNews: { type: Sequelize.BOOLEAN, defaultValue: false },
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
      variables: { type: Sequelize.JSON },
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
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      title: { type: Sequelize.STRING(200), allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      target_emails: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      total_signatures: { type: Sequelize.INTEGER, defaultValue: 0 },
      signature_fields: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      type: { type: Sequelize.ENUM('official','custom'), defaultValue: 'custom', allowNull: false },
      external_url: { type: Sequelize.STRING, allowNull: true },
      urgency: { type: Sequelize.BOOLEAN, defaultValue: false },
      deadline: { type: Sequelize.DATE, allowNull: true },
      hidden: { type: Sequelize.BOOLEAN, defaultValue: false },
      email_body_template: { type: Sequelize.TEXT, allowNull: true },
      emailTemplateId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'EmailTemplates', key: 'id' } },
      featured_image: { type: Sequelize.STRING, allowNull: true },
      created_by: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // signature_hashes
    await queryInterface.createTable('signature_hashes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      hash: { type: Sequelize.STRING, allowNull: false },
      petition_id: { type: Sequelize.UUID, references: { model: 'petitions', key: 'id' }, onDelete: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // email_queue
    await queryInterface.createTable('email_queue', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      petition_id: { type: Sequelize.UUID, references: { model: 'petitions', key: 'id' }, onDelete: 'CASCADE' },
      subscriberId: { type: Sequelize.INTEGER, references: { model: 'Subscribers', key: 'id' }, onDelete: 'CASCADE' },
      sent: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // email_quota
    await queryInterface.createTable('email_quota', {
      date: { type: Sequelize.DATEONLY, primaryKey: true },
      sent_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // Reports
    await queryInterface.createTable('Reports', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      content: { type: Sequelize.TEXT },
      fileUrl: { type: Sequelize.STRING },
      type: { type: Sequelize.ENUM('blog','report'), defaultValue: 'blog', allowNull: false },
      source: { type: Sequelize.STRING },
      author: { type: Sequelize.STRING },
      publishedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Documents
    await queryInterface.createTable('Documents', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      fileUrl: { type: Sequelize.STRING },
      type: { type: Sequelize.STRING },
      campaignId: { type: Sequelize.INTEGER, references: { model: 'Campaigns', key: 'id' }, onDelete: 'SET NULL' },
      actionId: { type: Sequelize.INTEGER, references: { model: 'Actions', key: 'id' }, onDelete: 'SET NULL' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // links
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."enum_links_category" AS ENUM('local','nacional','europeo','internacional','literatura');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryInterface.createTable('links', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      title: { type: Sequelize.STRING(200), allowNull: false },
      url: { type: Sequelize.STRING(500), allowNull: false },
      description: { type: Sequelize.TEXT },
      category: { type: 'enum_links_category', allowNull: false, defaultValue: 'local' },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('links');
    await queryInterface.dropTable('Documents');
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
    await queryInterface.dropTable('BDs');
    await queryInterface.dropTable('Campaigns');
    await queryInterface.dropTable('Users');
  },
};
