const { Op } = require('sequelize');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

const validatePassword = (password) => password && password.length >= 8;

// ========================= REGISTER =========================
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
    if (username.length < 3 || username.length > 30) return res.status(400).json({ message: 'El usuario debe tener entre 3 y 30 caracteres' });
    if (!validatePassword(password)) return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    const validRoles = ['superadmin', 'campaign_admin', 'action_admin', 'bds_admin'];
    const userRole = role && validRoles.includes(role) ? role : 'action_admin';
    const user = await User.create({ username, password, role: userRole });

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      userId: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

// ========================= LOGIN =========================
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Usuario y contraseña requeridos' });

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    // Verificar bloqueo de cuenta (opcional, las columnas existen)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(403).json({ message: `Cuenta bloqueada. Intenta de nuevo en ${remaining} minuto(s).` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Incrementar intentos fallidos y bloquear si es necesario
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60000);
      }
      await user.save({ fields: ['failedLoginAttempts', 'lockedUntil'] });
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Resetear contadores y actualizar último login
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date();
    await user.save({ fields: ['failedLoginAttempts', 'lockedUntil', 'lastLogin'] });

    // Generar tokens
    const token = user.generateJWT();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ fields: ['refreshToken'] });

    // Cookie HttpOnly (opcional)
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAMESITE || 'lax',
      domain: process.env.COOKIE_DOMAIN || undefined,
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ========================= GET ME =========================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refreshToken'] },
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

// ========================= LOGOUT =========================
exports.logout = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save({ fields: ['refreshToken'] });
    }
    res.clearCookie('access_token', { path: '/' });
    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ message: 'Error al cerrar sesión' });
  }
};

// ========================= REFRESH TOKEN =========================
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token requerido' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== refreshToken) return res.status(403).json({ message: 'Refresh token inválido' });

    const newToken = user.generateJWT();
    res.json({ token: newToken });
  } catch (error) {
    console.error('Error en refresh:', error);
    res.status(403).json({ message: 'Refresh token inválido o expirado' });
  }
};

// ========================= FORGOT PASSWORD =========================
exports.forgotPassword = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Nombre de usuario requerido' });

    const user = await User.findOne({ where: { username } });
    // Siempre respondemos igual para no revelar si el usuario existe
    if (!user) {
      return res.json({ message: 'Si el usuario existe, recibirás un enlace en tu correo.' });
    }

    const resetToken = user.generateResetToken();
    await user.save({ fields: ['resetToken', 'resetTokenExpires'] });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login/restablecer?token=${resetToken}`;

    if (user.email) {
      await sendPasswordResetEmail(user.email, resetUrl);
    } else {
      console.warn(`Usuario ${username} no tiene email configurado. No se pudo enviar el enlace.`);
    }

    res.json({ message: 'Si el usuario existe, recibirás un enlace en tu correo.' });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
};

// ========================= RESET PASSWORD =========================
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token y nueva contraseña requeridos' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetToken: hashedToken,
        resetTokenExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};