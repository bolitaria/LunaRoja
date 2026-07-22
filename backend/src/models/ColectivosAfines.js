const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // ajusta la ruta a tu configuración de Sequelize

const ColectivoAfines = sequelize.define('ColectivoAfines', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  imagen: {
    type: DataTypes.STRING,
    allowNull: false,
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
