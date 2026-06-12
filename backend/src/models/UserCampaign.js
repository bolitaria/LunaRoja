const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserCampaign = sequelize.define('UserCampaign', {
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
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Campaigns',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'campaignId'],
    },
  ],
});

module.exports = UserCampaign;