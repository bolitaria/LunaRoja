// backend/src/models/AdminAuditLog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminAuditLog = sequelize.define('AdminAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  entityId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  updatedAt: false,
  tableName: 'AdminAuditLogs',
});

module.exports = AdminAuditLog;