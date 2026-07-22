const rateLimit = require('express-rate-limit');

// Configuración real para producción/desarrollo
const prodLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                  // máximo 100 solicitudes por ventana
  message: 'Too many requests, please try again later.',
});

// En tests, desactivamos el rate limiting para evitar bloqueos
const testLimiter = (req, res, next) => next();

module.exports = process.env.NODE_ENV === 'test' ? testLimiter : prodLimiter;
