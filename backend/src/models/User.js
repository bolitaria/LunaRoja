const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs'); // ← CAMBIADO a bcryptjs
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    validate: { isEmail: true },
  },
  role: {
    type: DataTypes.STRING(50),
    defaultValue: 'action_admin',
  },
  refreshToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  resetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  resetTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'Users',
});

// Hooks de encriptación de contraseña (usando bcryptjs)
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(user.password, salt);
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.generateJWT = function () {
  return jwt.sign(
    { id: this.id, username: this.username, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

User.prototype.generateRefreshToken = function () {
  return jwt.sign(
    { id: this.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

User.prototype.generateResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetToken = hashedToken;
  this.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
  return rawToken;
};

module.exports = User;