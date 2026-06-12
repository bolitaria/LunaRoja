// backend/src/models/ChatGroup.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatGroup = sequelize.define('ChatGroup', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  platform: {
    type: DataTypes.ENUM('telegram', 'whatsapp', 'signal'),
    allowNull: false,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true,
    },
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Campaigns',
      key: 'id',
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

module.exports = ChatGroup;