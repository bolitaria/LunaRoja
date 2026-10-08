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
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  bdsId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'BDSs',           
      key: 'id',
    },
  },
}, {
  timestamps: true,
  tableName: 'UserBDS',          
});

module.exports = UserBDS;