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
  status: {
    type: DataTypes.ENUM('completed', 'in_progress', 'planned'),
    defaultValue: 'planned',
  },
  date: {
    type: DataTypes.DATEONLY, // formato YYYY-MM-DD
  },
  imageUrl: {
    type: DataTypes.STRING, // URL de imagen (opcional)
  },
  link: {
    type: DataTypes.STRING, // enlace externo para más info
  },
}, {
  timestamps: true,
});

module.exports = Action;