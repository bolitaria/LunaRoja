const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

/**
 * Donante. No guardamos email en claro: se guarda un hash
 * (HMAC-SHA256 con secreto del sistema) por si hay que vincular
 * varias donaciones del mismo donante sin exponer PII.
 */
class Donor extends Model {
  static associate(models) {
    this.belongsTo(models.Campaign, { foreignKey: 'campaignId', as: 'campaign' });
  }
}

Donor.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // Identificador público. Ej: 'DN-00045'
  publicId: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true,
  },
  // Hash del email (nunca el email en claro)
  donorHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'EUR',
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'refunded'),
    allowNull: false,
    defaultValue: 'completed',
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Campaigns', key: 'id' },
    onDelete: 'SET NULL',
  },
  donatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'Donor',
  tableName: 'Donors',
  timestamps: true,
  hooks: {
    afterCreate: async (donor) => {
      if (!donor.publicId) {
        const padded = String(donor.id).padStart(5, '0');
        await donor.update({ publicId: `DN-${padded}` }, { hooks: false });
      }
    },
  },
});

/**
 * Helper para generar donorHash desde un email.
 * Usa DONOR_HASH_SECRET del entorno (fallback de desarrollo).
 */
Donor.hashEmail = (email) => {
  const secret = process.env.DONOR_HASH_SECRET || 'dev_donor_hash_secret_change_me';
  return crypto.createHmac('sha256', secret).update(String(email).toLowerCase().trim()).digest('hex');
};

module.exports = Donor;
