const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 5) return null;
    return Math.min(times * 100, 3000);
  },
});

redisClient.on('error', (err) => console.error('Redis error:', err.message));
redisClient.on('connect', () => console.log('✅ Redis connected'));

module.exports = redisClient;