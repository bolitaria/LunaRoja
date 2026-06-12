const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Noticia = sequelize.define('Noticia', {
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
  youtubeUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true,
    },
  },
  thumbnail: {
    type: DataTypes.STRING,
  },
  publishedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  isNews: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Campaigns',
      key: 'id',
    },
  },
  actionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Actions',
      key: 'id',
    },
  },
}, {
  tableName: 'News',  // IMPORTANTE: coincide con el nombre real de la tabla
  timestamps: true,
});

module.exports = Noticia;