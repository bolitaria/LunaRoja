const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Documento asociable a UNA entidad (Action, Campaign, BDS o Report).
 *
 * source:
 *   - 'upload': fichero subido → filePath relleno, externalUrl null
 *   - 'link':   URL externa (Drive) → externalUrl relleno, filePath null,
 *               visibility SIEMPRE 'admin'
 *
 * visibility:
 *   - 'public': visible en la web pública (solo si source='upload')
 *   - 'admin':  visible solo para admins con scope sobre la entidad padre
 *
 * Reglas (validadas también en BD con CHECK constraints):
 *   1. Exactamente UNO de {actionId, campaignId, bdsId, reportId} debe estar set.
 *   2. source='upload' → filePath requerido, externalUrl null.
 *   3. source='link'   → externalUrl requerido, filePath null, visibility='admin'.
 */
class Document extends Model {
  static associate(models) {
    this.belongsTo(models.Action,   { foreignKey: 'actionId',   as: 'action' });
    this.belongsTo(models.Campaign, { foreignKey: 'campaignId', as: 'campaign' });
    this.belongsTo(models.BDS,      { foreignKey: 'bdsId',      as: 'bds' });
    this.belongsTo(models.Report,   { foreignKey: 'reportId',   as: 'report' });
    this.belongsTo(models.Petition, { foreignKey: 'petitionId', as: 'petition' });
    this.belongsTo(models.User,     { foreignKey: 'uploadedBy', as: 'uploader' });
  }

  get isLink()   { return this.source === 'link'; }
  get isUpload() { return this.source === 'upload'; }
  get isPublic() { return this.visibility === 'public'; }
  get isAdmin()  { return this.visibility === 'admin'; }
}

Document.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: true },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  source: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: { isIn: [['upload', 'link']] },
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  externalUrl: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    validate: {
      isUrlOrEmpty(value) {
        if (value === null || value === undefined) return;
        if (typeof value !== 'string' || !/^https?:\/\/.+/.test(value)) {
          throw new Error('externalUrl debe ser una URL http(s) válida');
        }
      },
    },
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  visibility: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'admin',
    validate: { isIn: [['public', 'admin']] },
  },
  actionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Actions', key: 'id' },
    onDelete: 'CASCADE',
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Campaigns', key: 'id' },
    onDelete: 'CASCADE',
  },
  bdsId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'BDSs', key: 'id' },
    onDelete: 'CASCADE',
  },
  petitionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'petitions', key: 'id' },
  },
  reportId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Reports', key: 'id' },
    onDelete: 'CASCADE',
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL',
  },
}, {
  sequelize,
  modelName: 'Document',
  tableName: 'Documents',
  timestamps: true,
  underscored: false,
});

module.exports = Document;
