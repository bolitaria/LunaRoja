// backend/src/config/redis.js
const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 10) {
      return null;
    }
    return Math.min(times * 200, 5000);
  },
  enableReadyCheck: true,
  enableOfflineQueue: true,
});

redisClient.on('error', (err) => console.error('Redis error:', err.message));
redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('ready', () => console.log('Redis listo para usar'));

module.exports = redisClient;