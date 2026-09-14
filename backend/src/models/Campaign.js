const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Campaña.
 *
 * Documentos se gestionan vía tabla `Documents` (FK campaignId).
 * `status` controla el ciclo de procesado async de imágenes:
 *   - processing: imágenes pendientes de worker
 *   - published:  visible en web pública
 *   - error:      falló el procesado (ver processingError)
 */
const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#ff0000',
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  groups: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
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

module.exports = Campaign;
