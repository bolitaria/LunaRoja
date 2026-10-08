const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Cuota diaria de emails (Brevo free = 300/día).
 *
 * Una fila por día. La PK es `date` en formato 'YYYY-MM-DD' (Europe/Madrid).
 * El worker consulta esta tabla antes de cada envío para decidir si se
 * envía ahora o se encola para el día siguiente.
 *
 * Columnas:
 *  - date:             fecha del día (Europe/Madrid)
 *  - sent_count:       emails enviados ese día
 *  - limit_reached_at: cuándo se alcanzó el límite de 300 (null si no)
 *  - notified_at:      cuándo se avisó al admin del 100% (null si no)
 */
class EmailQuota extends Model {
  static associate() {}

  get hasCapacity() {
    return this.sent_count < 300;
  }

  get remaining() {
    return Math.max(0, 300 - this.sent_count);
  }
}

EmailQuota.init({
  date: {
    type: DataTypes.DATEONLY,
    primaryKey: true,
    allowNull: false,
  },
  sent_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  limit_reached_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'EmailQuota',
  tableName: 'email_quota',
  underscored: true,
  timestamps: false,
});

module.exports = EmailQuota;
