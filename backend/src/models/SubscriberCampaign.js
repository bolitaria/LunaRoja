const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriberCampaign = sequelize.define('SubscriberCampaign', {
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
  // Tipo de entidad: 'campaign' o 'bds'
  entityType: {
    type: DataTypes.ENUM('campaign', 'bds'),
    allowNull: false,
  },
  // ID de la entidad (campaignId o bdsId)
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isFollowing: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'SubscriberCampaigns',
  indexes: [
    { unique: true, fields: ['subscriberId', 'entityType', 'entityId'] },
  ],
});

module.exports = SubscriberCampaign;