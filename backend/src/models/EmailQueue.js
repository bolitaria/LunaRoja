const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class EmailQueue extends Model {
  static associate(models) {
    this.belongsTo(models.Petition, { foreignKey: 'petition_id', as: 'petition' });
  }
}

EmailQueue.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  petition_id: { type: DataTypes.UUID, allowNull: false },
  signer_data: { type: DataTypes.JSONB, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'sent', 'failed'), defaultValue: 'pending' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  sent_at: { type: DataTypes.DATE, allowNull: true },
}, {
  sequelize,
  modelName: 'EmailQueue',
  tableName: 'email_queue',
  underscored: true,
  timestamps: false,
});

module.exports = EmailQueue;
