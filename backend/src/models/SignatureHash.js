const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class SignatureHash extends Model {
  static associate(models) {
    this.belongsTo(models.Petition, { foreignKey: 'petition_id', as: 'petition' });
  }
}

SignatureHash.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  petition_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  identifier_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  signed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'SignatureHash',
  tableName: 'signature_hashes',
  underscored: true,
  timestamps: false,
});

module.exports = SignatureHash;
