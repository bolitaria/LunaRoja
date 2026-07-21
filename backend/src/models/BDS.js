// backend/src/models/BDS.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BDS = sequelize.define('BDS', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  color: { type: DataTypes.STRING, defaultValue: '#ff0000' },
  imageUrl: { type: DataTypes.STRING },
  groups: { type: DataTypes.JSON },
  documentLink: { type: DataTypes.STRING },
  document: { type: DataTypes.STRING },
}, { timestamps: true,
    tableName: 'BDSs'
 });

module.exports = BDS;
