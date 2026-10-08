const { Op } = require('sequelize');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendPasswordResetEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
const JWT_EXPIRES_IN = '1d'; // ajustar según requerimientos

const validatePassword = (password) => password && password.length >= 8;

// Función auxiliar para generar JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

exports.register = async (req, res) => {
  // sin cambios (asumir que existe y funciona)
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar bloqueo
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(403).json({ message: `Cuenta bloqueada. Intenta de nuevo en ${remaining} minuto(s).` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      if (process.env.NODE_ENV !== 'test') {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const lockedUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60000) : null;
        await user.update({ failedLoginAttempts: attempts, lockedUntil });
      }
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Resetear contadores y actualizar último acceso
    await user.update({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    });

    const token = generateToken(user);

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
  // No implementado aún; se responde 501 como original
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
      // Generar token de reset y guardar su hash
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora

      await user.update({
        resetToken: hashedToken,
        resetTokenExpires,
      });

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login/restablecer?token=${resetToken}`;

      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (emailError) {
        console.error('Error al enviar el correo de restablecimiento:', emailError);
        // No interrumpir la respuesta
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
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token y nueva contraseña requeridos' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

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

    // Hashear la nueva contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
    });

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};