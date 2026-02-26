const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkingGroup = sequelize.define('WorkingGroup', {
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
    type: DataTypes.ENUM('telegram', 'whatsapp'),
    defaultValue: 'telegram',
    allowNull: false,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  region: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

module.exports = WorkingGroup;