const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserAction = sequelize.define('UserAction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'CASCADE',
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
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'actionId'],
    },
  ],
});

module.exports = UserAction;