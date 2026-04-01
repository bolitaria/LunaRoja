const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust to your DB config

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
    validate: {
      isEmail: true,
    },
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
}, {
  tableName: 'subscribers',
  timestamps: false, // or use createdAt/updatedAt if you prefer
});

module.exports = Subscriber;