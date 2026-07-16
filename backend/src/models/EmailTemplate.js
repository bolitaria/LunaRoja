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
    allowNull: false,
  },
  variables: {
    type: DataTypes.JSON,
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
  // NUEVOS CAMPOS
  headerColor: {
    type: DataTypes.STRING(7),
    defaultValue: '#b91c1c',
  },
  buttonColor: {
    type: DataTypes.STRING(7),
    defaultValue: '#16a34a',
  },
  footerColor: {
    type: DataTypes.STRING(7),
    defaultValue: '#1f2937',
  },
  backgroundColor: {
    type: DataTypes.STRING(7),
    defaultValue: '#f3f4f6',
  },
}, {
  timestamps: true,
  tableName: 'EmailTemplates',
});

module.exports = EmailTemplate;