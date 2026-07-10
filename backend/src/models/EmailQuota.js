const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class EmailQuota extends Model {
  static associate() {}
}

EmailQuota.init({
  date: { type: DataTypes.DATEONLY, primaryKey: true },
  sent_count: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  sequelize,
  modelName: 'EmailQuota',
  tableName: 'email_quota',
  underscored: true,
  timestamps: false,
});

module.exports = EmailQuota;
