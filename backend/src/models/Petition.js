const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Petition extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    this.hasMany(models.SignatureHash, { foreignKey: 'petition_id', as: 'signatureHashes' });
  }
}

Petition.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  target_emails: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
  total_signatures: { type: DataTypes.INTEGER, defaultValue: 0 },
  signature_fields: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  type: { type: DataTypes.ENUM('official', 'custom'), defaultValue: 'custom', allowNull: false },
  external_url: { type: DataTypes.STRING, allowNull: true },
  urgency: { type: DataTypes.BOOLEAN, defaultValue: false },
  deadline: { type: DataTypes.DATE, allowNull: true },
  hidden: { type: DataTypes.BOOLEAN, defaultValue: false },
  email_body_template: { type: DataTypes.TEXT, allowNull: true },
  featured_image: { type: DataTypes.STRING, allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  sequelize,
  modelName: 'Petition',
  tableName: 'petitions',
  underscored: true,
});

module.exports = Petition;
