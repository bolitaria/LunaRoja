const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // 1. Cookie HttpOnly (nuevo sistema)
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }
    // 2. Header Authorization (compatibilidad)
    else if (req.header('Authorization')?.startsWith('Bearer ')) {
      token = req.header('Authorization').split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado' });
    }

    // Validar que el token no sea literalmente "null" o "undefined"
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
    // Solo registrar advertencia sin stack trace
    console.warn('Token inválido recibido:', error.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;