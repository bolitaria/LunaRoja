const sequelize = require('../config/database');
// const redisClient = require('../config/redis'); // si lo usas

exports.checkHealth = async () => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    services: {
      database: 'unknown',
      // redis: 'unknown',
    },
  };

  try {
    await sequelize.authenticate();
    health.services.database = 'ok';
  } catch (e) {
    health.status = 'degraded';
    health.services.database = 'error';
  }

  // Ejemplo con Redis
  // try {
  //   await redisClient.ping();
  //   health.services.redis = 'ok';
  // } catch (e) {
  //   health.status = 'degraded';
  //   health.services.redis = 'error';
  // }

  return health;
};