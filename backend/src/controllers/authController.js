const { Op } = require('sequelize');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

const validatePassword = (password) => password && password.length >= 8;

exports.register = async (req, res) => { /* sin cambios */ };

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Usuario y contraseña requeridos' });

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(403).json({ message: `Cuenta bloqueada. Intenta de nuevo en ${remaining} minuto(s).` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60000);
      }
      await user.save({ fields: ['failedLoginAttempts', 'lockedUntil'] });
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date();
    await user.save({ fields: ['failedLoginAttempts', 'lockedUntil', 'lastLogin'] });

    const token = user.generateJWT();

    // Devolver solo el token en el JSON (sin cookies)
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

// ========================= LOGOUT =========================
exports.logout = async (req, res) => {
  // El frontend se encarga de eliminar el token de localStorage
  res.json({ message: 'Logout exitoso' });
};

// ========================= REFRESH TOKEN =========================
// No se usa en este momento, pero lo dejamos preparado por si lo necesitas más adelante
exports.refresh = async (req, res) => {
  // Este método ya no se invoca, pero lo mantengo por compatibilidad
  res.status(501).json({ message: 'No implementado' });
};

// ========================= FORGOT PASSWORD =========================
exports.forgotPassword = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Nombre de usuario requerido' });

    const user = await User.findOne({ where: { username } });
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