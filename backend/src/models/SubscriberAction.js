const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriberAction = sequelize.define('SubscriberAction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  subscriberId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Subscribers', key: 'id' },
    onDelete: 'CASCADE',
  },
  actionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Actions', key: 'id' },
    onDelete: 'CASCADE',
  },
  isFollowing: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'SubscriberActions',
  indexes: [{ unique: true, fields: ['subscriberId', 'actionId'] }],
});

module.exports = SubscriberAction;