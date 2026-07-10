const rateLimit = require('express-rate-limit');

const signLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
  message: { message: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

module.exports = { signLimiter };
