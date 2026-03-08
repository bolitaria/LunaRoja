const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InstagramPost = sequelize.define('InstagramPost', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  postId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  shortcode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  caption: {
    type: DataTypes.TEXT,        // Cambiado a TEXT para textos largos
    allowNull: true,
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video', 'carousel'),
    allowNull: false,
  },
  mediaUrl: {
    type: DataTypes.TEXT,        // Cambiado a TEXT para URLs largas
    allowNull: false,
  },
  thumbnailUrl: {
    type: DataTypes.TEXT,        // Cambiado a TEXT
    allowNull: true,
  },
  permalink: {
    type: DataTypes.TEXT,        // Cambiado a TEXT
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  comments: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  accountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'InstagramAccounts',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  timestamps: true,
});

module.exports = InstagramPost;