const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Action = sequelize.define('Action', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  category: {
    type: DataTypes.ENUM(
      'webinar', 'talk', 'protest', 'bds', 'strike', 'march',
      'solidarity_action', 'workshop'
    ),
    defaultValue: 'protest',
  },
  datetime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  locationType: {
    type: DataTypes.ENUM('online', 'presencial'),
    defaultValue: 'online',
  },
  onlineLink: {
    type: DataTypes.STRING,
  },
  placeName: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  latitude: {
    type: DataTypes.FLOAT,
  },
  longitude: {
    type: DataTypes.FLOAT,
  },
  registrationLink: {
    type: DataTypes.STRING,
  },
  recordingUrl: {
    type: DataTypes.STRING,
  },
  isLive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Campaigns',
      key: 'id',
    },
  },
  featuredImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Nuevos campos
  groups: {
    type: DataTypes.JSON,          // array de { platform, link }
    allowNull: true,
  },
  documentLink: {
    type: DataTypes.STRING,        // enlace externo (opcional)
    allowNull: true,
  },
  document: {
    type: DataTypes.STRING,        // ruta al archivo subido
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Action;