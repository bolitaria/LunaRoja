const crypto = require('crypto');

let cacheClient = null;

const initSessionCache = async () => {
  if (cacheClient) return cacheClient;

  // Leemos host y puerto de las variables de entorno (las que pusiste en docker-compose)
  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

  const Redis = require('ioredis');
  cacheClient = new Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null,
  });
  return cacheClient;
};

const cacheSession = async (sessionKey, payload, ttlSeconds = 900) => {
  const client = await initSessionCache();
  const normalizedKey = `session:${crypto.createHash('sha1').update(sessionKey).digest('hex')}`;
  await client.set(normalizedKey, JSON.stringify(payload), 'EX', ttlSeconds);
  return normalizedKey;
};

const getCachedSession = async (sessionKey) => {
  const client = await initSessionCache();
  const normalizedKey = `session:${crypto.createHash('sha1').update(sessionKey).digest('hex')}`;
  const cached = await client.get(normalizedKey);
  return cached ? JSON.parse(cached) : null;
};

module.exports = {
  initSessionCache,
  cacheSession,
  getCachedSession,
};