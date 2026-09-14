// backend/src/services/healthService.js
const sequelize = require('../config/database');
const redis = require('../config/redis');

/**
 * Liveness: solo comprueba que el proceso está vivo.
 * Rápido, sin dependencias externas.
 */
exports.checkLive = () => {
  return {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
  };
};

/**
 * Readiness: comprueba que las dependencias críticas están disponibles.
 * Si BD o Redis fallan, devuelve 'degraded'.
 */
exports.checkReady = async () => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    await sequelize.authenticate();
    health.services.database = 'ok';
  } catch (e) {
    health.status = 'degraded';
    health.services.database = 'error';
  }

  try {
    const pong = await redis.ping();
    health.services.redis = pong === 'PONG' ? 'ok' : 'error';
    if (health.services.redis !== 'ok') health.status = 'degraded';
  } catch (e) {
    health.status = 'degraded';
    health.services.redis = 'error';
  }

  return health;
};