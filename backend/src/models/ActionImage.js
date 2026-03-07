const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActionImage = sequelize.define('ActionImage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  actionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Actions',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
});

module.exports = ActionImage;