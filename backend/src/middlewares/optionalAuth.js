const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;   // { id, role, ... }
    }
  } catch (error) {
    // Sin token o inválido → continuar sin usuario
  }
  next();
};

module.exports = optionalAuth;