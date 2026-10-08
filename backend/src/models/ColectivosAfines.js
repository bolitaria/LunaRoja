const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ColectivoAfines = sequelize.define('ColectivoAfines', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'logoUrl',          // columna exacta en BD
  },
  link: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'colectivos_afines',
  timestamps: true,
});

module.exports = ColectivoAfines;