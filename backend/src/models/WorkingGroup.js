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
  telegramLink: {
    type: DataTypes.STRING, // enlace de invitación al grupo
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

module.exports = WorkingGroup;