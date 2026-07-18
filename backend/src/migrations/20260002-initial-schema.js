'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ==============================
    // Tabla Users
    // ==============================
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true, // Se hizo NOT NULL manualmente después, lo manejamos así
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'action_admin',
      },
      refreshToken: Sequelize.TEXT,
      resetToken: Sequelize.STRING,
      resetTokenExpires: Sequelize.DATE,
      lastLogin: Sequelize.DATE,
      failedLoginAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      lockedUntil: Sequelize.DATE,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ... (resto de tablas: Campaigns, Actions, etc., las dejamos igual hasta petitions)

    // ==============================
    // Tabla Petitions (CORREGIDA: incluye email_template_id)
    // ==============================
    await queryInterface.createTable('petitions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: Sequelize.STRING,
      content: Sequelize.TEXT,
      target_emails: Sequelize.ARRAY(Sequelize.STRING),
      total_signatures: Sequelize.INTEGER,
      signature_fields: Sequelize.JSONB,
      type: Sequelize.STRING,
      external_url: Sequelize.STRING,
      urgency: Sequelize.BOOLEAN,
      deadline: Sequelize.DATE,
      hidden: Sequelize.BOOLEAN,
      email_body_template: Sequelize.TEXT,
      emailTemplateId: {
        type: Sequelize.INTEGER,
        references: { model: 'email_templates', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: true,
      },
      featured_image: Sequelize.STRING,
      created_by: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    // ==============================
    // Tabla EmailQuota (CORREGIDA: incluye createdAt y updatedAt)
    // ==============================
    await queryInterface.createTable('email_quota', {
      date: {
        type: Sequelize.DATEONLY,
        primaryKey: true,
      },
      sent_count: Sequelize.INTEGER,
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // ... (resto de tablas: Reports, EmailTemplates, Links, etc.)

    // Ya NO necesitamos los bloques DO $$ condicionales, pues las columnas se crean desde el inicio
  },

  async down(queryInterface, Sequelize) {
    // Eliminar tablas en orden inverso
    await queryInterface.dropTable('Links');
    await queryInterface.dropTable('email_templates');
    await queryInterface.dropTable('Reports');
    await queryInterface.dropTable('email_quota');
    await queryInterface.dropTable('email_queues');
    await queryInterface.dropTable('signature_hashes');
    await queryInterface.dropTable('petitions');
    await queryInterface.dropTable('News');
    await queryInterface.dropTable('ChatGroups');
    await queryInterface.dropTable('SubscribersReminders');
    await queryInterface.dropTable('Subscribers');
    await queryInterface.dropTable('UserBDSes');
    await queryInterface.dropTable('UserActions');
    await queryInterface.dropTable('UserCampaigns');
    await queryInterface.dropTable('BDSes');
    await queryInterface.dropTable('ActionImages');
    await queryInterface.dropTable('Actions');
    await queryInterface.dropTable('Campaigns');
    await queryInterface.dropTable('Users');
  },
};
