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

exports.logout = async (req, res) => {
  res.json({ message: 'Logout exitoso' });
};

exports.refresh = async (req, res) => {
  res.status(501).json({ message: 'No implementado' });
};

// ========================= FORGOT PASSWORD (CORREGIDO) =========================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'El correo electrónico es obligatorio' });
    }

    const user = await User.findOne({ where: { email } });

    if (user) {
      const resetToken = user.generateResetToken();
      await user.save({ fields: ['resetToken', 'resetTokenExpires'] });

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login/restablecer?token=${resetToken}`;
      
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (emailError) {
        console.error('Error al enviar el correo de restablecimiento:', emailError);
      }
    }

    // Siempre responder 200 (no revelar si el email existe)
    return res.status(200).json({
      message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
    });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    return res.status(500).json({ message: 'Error al procesar la solicitud' });
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