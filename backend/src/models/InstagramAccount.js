const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InstagramAccount = sequelize.define('InstagramAccount', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  tag: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Etiqueta para filtrar publicaciones (ej. campaña, acción)',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastScraped: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Campaigns',
      key: 'id',
    },
  },
}, {
  timestamps: true,
});

module.exports = InstagramAccount;