const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
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
  type: {
    type: DataTypes.ENUM('webinar', 'talk'),
    defaultValue: 'webinar',
  },
  datetime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  // Nuevos campos para ubicación
  locationType: {
    type: DataTypes.ENUM('online', 'presential'),
    defaultValue: 'online',
  },
  onlineLink: {
    type: DataTypes.STRING, // URL para reunión online (Zoom, Meet, etc.)
  },
  placeName: {
    type: DataTypes.STRING, // Nombre del lugar (si es presencial)
  },
  address: {
    type: DataTypes.STRING, // Dirección completa
  },
  latitude: {
    type: DataTypes.FLOAT, // Para mapa (opcional)
  },
  longitude: {
    type: DataTypes.FLOAT,
  },
  // Campos existentes
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
}, {
  timestamps: true,
});

module.exports = Event;