const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscribersReminder = sequelize.define('SubscribersReminder', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  actionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Actions', 
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  subscriberId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Subscribers', 
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: 'SubscribersReminders', // opcional si tu tabla tiene ese nombre exacto
});

module.exports = SubscribersReminder;