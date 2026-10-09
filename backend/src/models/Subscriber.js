const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscriber = sequelize.define('Subscriber', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  // Identificador público sin exponer email. Ej: 'SR-00234'
  publicId: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true, // se autogenera en afterCreate
  },
  status: {
    type: DataTypes.ENUM('active', 'unsubscribed'),
    defaultValue: 'active',
  },
  sendReminders: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  subscribedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  unsubscribedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'Subscribers',
  timestamps: true,
  hooks: {
    afterCreate: async (subscriber) => {
      if (!subscriber.publicId) {
        const padded = String(subscriber.id).padStart(5, '0');
        await subscriber.update({ publicId: `SR-${padded}` }, { hooks: false });
      }
    },
  },
});

module.exports = Subscriber;
