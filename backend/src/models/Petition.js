const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const EmailTemplate = require('./EmailTemplate');

class Petition extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    this.hasMany(models.SignatureHash, { foreignKey: 'petition_id', as: 'signatureHashes' });
    this.belongsTo(models.EmailTemplate, { foreignKey: 'emailTemplateId', as: 'emailTemplate' });
  }
}

Petition.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  description: { type: DataTypes.TEXT, allowNull: true },
  target_emails: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
  total_signatures: { type: DataTypes.INTEGER, defaultValue: 0 },
  signature_fields: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  type: { type: DataTypes.ENUM('official', 'custom'), defaultValue: 'custom', allowNull: false },
  external_url: { type: DataTypes.STRING, allowNull: true },
  urgency: { type: DataTypes.BOOLEAN, defaultValue: false },
  deadline: { type: DataTypes.DATE, allowNull: true },
  hidden: { type: DataTypes.BOOLEAN, defaultValue: false },
  emailTemplateId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: EmailTemplate, key: 'id' },
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'featured_image', // para mantener compatibilidad con la columna existente
  },
  email_subject: { type: DataTypes.STRING(255), allowNull: true },
  email_content_mode: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'text' },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  sequelize,
  modelName: 'Petition',
  tableName: 'petitions',
  underscored: true,
});

module.exports = Petition;