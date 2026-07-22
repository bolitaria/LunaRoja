const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  content: { type: DataTypes.TEXT },
  fileUrl: { type: DataTypes.STRING, allowNull: true },
  type: {
    type: DataTypes.ENUM('blog', 'report'),
    defaultValue: 'blog',
    allowNull: false
  },
  source: { type: DataTypes.STRING, allowNull: true },
  author: { type: DataTypes.STRING, allowNull: true },
  publishedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: true });

module.exports = Report;
