const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Link extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  }
}

Link.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  url: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: {
    type: DataTypes.ENUM('local', 'nacional', 'europeo', 'internacional', 'literatura', 'bibliografia'),
    allowNull: false,
    defaultValue: 'local',
  },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  sequelize,
  modelName: 'Link',
  tableName: 'links',
  underscored: true,
});

module.exports = Link;