const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Campaña BDS (Boicot, Desinversión, Sanciones).
 *
 * Documentos se gestionan vía tabla `Documents` (FK bdsId).
 * `status` controla el ciclo de procesado async de imágenes.
 */
const BDS = sequelize.define('BDS', {
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
  },
  groups: {
    type: DataTypes.JSON,
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
  tableName: 'BDSs',
});

module.exports = BDS;
