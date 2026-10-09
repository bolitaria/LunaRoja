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

  // Tipo de noticia: youtube | article | internal
  newsType: {
    type: DataTypes.ENUM('youtube', 'article', 'internal'),
    allowNull: false,
    defaultValue: 'youtube',
  },

  // Solo para newsType='youtube'
  youtubeUrl: {
    type: DataTypes.STRING,
    allowNull: true, // antes era false, ahora nullable
    validate: { isUrl: true },
  },

  // Solo para newsType='article'
  externalUrl: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    validate: { isUrl: true },
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ogImage: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  ogDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  publishedAtSource: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  scrapedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // Solo para newsType='internal'
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
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
    references: { model: 'Campaigns', key: 'id' },
  },
  actionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Actions', key: 'id' },
  },
}, {
  tableName: 'News',
  timestamps: true,
});

module.exports = Noticia;
