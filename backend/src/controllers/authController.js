const User = require('../models/User');
const jwt = require('jsonwebtoken');

const validatePassword = (password) => password && password.length >= 8;

exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
    if (username.length < 3 || username.length > 30) return res.status(400).json({ message: 'El usuario debe tener entre 3 y 30 caracteres' });
    if (!validatePassword(password)) return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    const validRoles = ['superadmin', 'campaign_admin', 'action_admin'];
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
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) user.lockedUntil = new Date(Date.now() + 30 * 60000);
      await user.save({ fields: ['failedLoginAttempts', 'lockedUntil'] });
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date();
    await user.save({ fields: ['failedLoginAttempts', 'lockedUntil', 'lastLogin'] });

    const token = user.generateJWT();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ fields: ['refreshToken'] });

    // Emitir cookie HttpOnly
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

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

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