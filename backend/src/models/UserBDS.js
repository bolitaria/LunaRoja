const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserBDS = sequelize.define('UserBDS', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bdsId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'UserBDS',   // por claridad
});

module.exports = UserBDS;