const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscriber = sequelize.define('Subscriber', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  status: {
    type: DataTypes.ENUM('active', 'unsubscribed'),
    defaultValue: 'active',
  },
  sendReminders: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  subscribedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'Subscribers',
  timestamps: true,
});

module.exports = Subscriber;