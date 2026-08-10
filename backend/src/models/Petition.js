const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const EmailTemplate = require('./EmailTemplate'); // Asegúrate de que este import funcione

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
  target_emails: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
  total_signatures: { type: DataTypes.INTEGER, defaultValue: 0 },
  signature_fields: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  type: { type: DataTypes.ENUM('official', 'custom'), defaultValue: 'custom', allowNull: false },
  external_url: { type: DataTypes.STRING, allowNull: true },
  urgency: { type: DataTypes.BOOLEAN, defaultValue: false },
  deadline: { type: DataTypes.DATE, allowNull: true },
  hidden: { type: DataTypes.BOOLEAN, defaultValue: false },
  emailTemplateId: {                         // NUEVO CAMPO
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: EmailTemplate, key: 'id' },
  },
  featured_image: { type: DataTypes.STRING, allowNull: true },
  email_subject: { type: DataTypes.STRING(255), allowNull: true },
  header_color: { type: DataTypes.STRING(7), allowNull: true },
  button_color: { type: DataTypes.STRING(7), allowNull: true },
  footer_color: { type: DataTypes.STRING(7), allowNull: true },
  background_color: { type: DataTypes.STRING(7), allowNull: true },
  title_color: { type: DataTypes.STRING(7), allowNull: true, defaultValue: '#ffffff' },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  sequelize,
  modelName: 'Petition',
  tableName: 'petitions',
  underscored: true,
});

module.exports = Petition;