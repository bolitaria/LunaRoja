// backend/src/models/EmailTemplate.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailTemplate = sequelize.define('EmailTemplate', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,   // HTML completo con placeholders {{variable}}
  },
  variables: {
    type: DataTypes.JSON,   // ej: ["username","campaign.name","action.title","unsubscribeLink"]
    defaultValue: [],
  },
  type: {
    type: DataTypes.ENUM('system', 'custom'),
    defaultValue: 'custom',
  },
  associatedEvent: {
    type: DataTypes.ENUM('campaign_created', 'action_created', 'subscriber_welcome', 'reminder', 'custom'),
    defaultValue: 'custom',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'EmailTemplates',
});

module.exports = EmailTemplate;