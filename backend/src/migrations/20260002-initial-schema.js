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

    // ==============================
    // Tabla Campaigns
    // ==============================
    await queryInterface.createTable('Campaigns', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: Sequelize.STRING,
      content: Sequelize.TEXT,
      featured_image: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla Actions
    // ==============================
    await queryInterface.createTable('Actions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: Sequelize.STRING,
      description: Sequelize.TEXT,
      campaignId: {
        type: Sequelize.INTEGER,
        references: { model: 'Campaigns', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      bdsId: {
        type: Sequelize.INTEGER,
        references: { model: 'BDSes', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla ActionImages
    // ==============================
    await queryInterface.createTable('ActionImages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      actionId: {
        type: Sequelize.INTEGER,
        references: { model: 'Actions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      filename: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla BDSes
    // ==============================
    await queryInterface.createTable('BDSes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: Sequelize.STRING,
      content: Sequelize.TEXT,
      featured_image: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla UserCampaign
    // ==============================
    await queryInterface.createTable('UserCampaigns', {
      userId: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primaryKey: true,
      },
      campaignId: {
        type: Sequelize.INTEGER,
        references: { model: 'Campaigns', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primaryKey: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla UserAction
    // ==============================
    await queryInterface.createTable('UserActions', {
      userId: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primaryKey: true,
      },
      actionId: {
        type: Sequelize.INTEGER,
        references: { model: 'Actions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primaryKey: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla UserBDS
    // ==============================
    await queryInterface.createTable('UserBDSes', {
      userId: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primaryKey: true,
      },
      bdsId: {
        type: Sequelize.INTEGER,
        references: { model: 'BDSes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primaryKey: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla Subscribers
    // ==============================
    await queryInterface.createTable('Subscribers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla SubscribersReminders
    // ==============================
    await queryInterface.createTable('SubscribersReminders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      subscriberId: {
        type: Sequelize.INTEGER,
        references: { model: 'Subscribers', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      actionId: {
        type: Sequelize.INTEGER,
        references: { model: 'Actions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      reminderDate: Sequelize.DATE,
      sent: Sequelize.BOOLEAN,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla ChatGroups
    // ==============================
    await queryInterface.createTable('ChatGroups', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: Sequelize.STRING,
      inviteLink: Sequelize.STRING,
      campaignId: {
        type: Sequelize.INTEGER,
        references: { model: 'Campaigns', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      actionId: {
        type: Sequelize.INTEGER,
        references: { model: 'Actions', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla News
    // ==============================
    await queryInterface.createTable('News', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: Sequelize.STRING,
      content: Sequelize.TEXT,
      featured_image: Sequelize.STRING,
      campaignId: {
        type: Sequelize.INTEGER,
        references: { model: 'Campaigns', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      actionId: {
        type: Sequelize.INTEGER,
        references: { model: 'Actions', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla Petitions
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
    // Tabla SignatureHashes
    // ==============================
    await queryInterface.createTable('signature_hashes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      petition_id: {
        type: Sequelize.INTEGER,
        references: { model: 'petitions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      identifier_hash: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla EmailQueue
    // ==============================
    await queryInterface.createTable('email_queues', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      to: Sequelize.STRING,
      subject: Sequelize.STRING,
      template: Sequelize.STRING,
      context: Sequelize.JSONB,
      petition_id: {
        type: Sequelize.INTEGER,
        references: { model: 'petitions', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      sent: Sequelize.BOOLEAN,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla EmailQuota
    // ==============================
    await queryInterface.createTable('email_quota', {
      date: {
        type: Sequelize.DATEONLY,
        primaryKey: true,
      },
      sent_count: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla Reports
    // ==============================
    await queryInterface.createTable('Reports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: Sequelize.STRING,
      content: Sequelize.TEXT,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla EmailTemplates
    // ==============================
    await queryInterface.createTable('email_templates', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: Sequelize.STRING,
      subject: Sequelize.STRING,
      body: Sequelize.TEXT,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==============================
    // Tabla Links
    // ==============================
    await queryInterface.createTable('Links', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      title: Sequelize.STRING,
      url: Sequelize.STRING,
      description: Sequelize.TEXT,
      created_by: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // ==================================================
    // 🛠️ Correcciones condicionales para entornos que ya
    //     tengan la tabla pero les falten columnas.
    // ==================================================
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'petitions' AND column_name = 'email_template_id'
        ) THEN
          ALTER TABLE petitions ADD COLUMN email_template_id INTEGER
            REFERENCES email_templates(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'email_quota' AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE email_quota ADD COLUMN "createdAt" timestamptz NOT NULL DEFAULT now();
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'email_quota' AND column_name = 'updatedAt'
        ) THEN
          ALTER TABLE email_quota ADD COLUMN "updatedAt" timestamptz NOT NULL DEFAULT now();
        END IF;
      END
      $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Eliminar todas las tablas en orden inverso para evitar problemas de FK
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
