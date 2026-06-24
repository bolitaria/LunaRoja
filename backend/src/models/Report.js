const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  content: { type: DataTypes.TEXT },          // texto enriquecido (HTML)
  fileUrl: { type: DataTypes.STRING, allowNull: true },
  publishedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: true });

module.exports = Report;