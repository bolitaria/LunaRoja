const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware de autenticación (el original)
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    } else if (req.header('Authorization')?.startsWith('Bearer ')) {
      token = req.header('Authorization').split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado' });
    }

    if (token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.warn('Token inválido recibido:', error.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Middleware de verificación de rol admin (ya lo usas en otras rutas seguramente)
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin' && req.user.role !== 'campaign_admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
};

// Para mantener compatibilidad con código anterior que importa authMiddleware directamente
const authMiddleware = authenticate;

module.exports = { authenticate, isAdmin, authMiddleware };
