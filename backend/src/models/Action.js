const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Acción (evento, protesta, charla…).
 *
 * Documentos y enlaces externos se gestionan mediante la tabla `Documents`
 * (polimórfica, con FK a Actions.id). Ya NO existen campos inline como
 * `document`, `documentLink`, `featuredImage`.
 *
 * Estado (`status`):
 *  - processing: imágenes pendientes de optimizar (recién creada)
 *  - published:  imágenes optimizadas, visible en web pública
 *  - error:      falló el procesado → hay que revisar `processingError`
 */
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
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Campaigns', key: 'id' },
  },
  bdsId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'BDSs', key: 'id' },
  },
  // Imagen principal de la acción
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Galería de imágenes (hasta 20). Array JSONB de URLs.
  galleryImages: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  groups: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  privateLink: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  urgent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  enableAttendance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Estado de procesado de imágenes (nuevo flujo async)
  status: {
    type: DataTypes.STRING(15),
    allowNull: false,
    defaultValue: 'processing',
    validate: { isIn: [['processing', 'published', 'error']] },
  },
  processingError: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Action;
