const rateLimit = require('express-rate-limit');

// Configuración real para producción/desarrollo
const prodSignLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,                    // máximo 5 intentos de firma por ventana
  message: 'Demasiados intentos de firma. Inténtalo más tarde.',
});

// En tests, desactivamos el rate limiting para evitar bloqueos
const testSignLimiter = (req, res, next) => next();

const signLimiter = process.env.NODE_ENV === 'test' ? testSignLimiter : prodSignLimiter;

module.exports = { signLimiter };
