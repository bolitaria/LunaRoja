const redis = require('../config/redis');

/**
 * Middleware de caché con métricas Prometheus integradas.
 * La clave incluye la URL completa (con query params) y el usuario/rol.
 *
 * IMPORTANTE: solo se cachean respuestas con status 2xx. Los errores
 * (4xx, 5xx) nunca se guardan en caché, para no servir errores obsoletos.
 */
module.exports = (duration = 60, tag = '') => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    let userKey = 'public';
    if (req.user && req.user.id) {
      userKey = `${req.user.role}:${req.user.id}`;
    }

    const tagPart = tag ? `${tag}:` : '';
    const key = `cache:${tagPart}${userKey}:${req.originalUrl || req.url}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        if (global.__cacheMetrics) global.__cacheMetrics.cacheHits.inc();
        return res.json(JSON.parse(cached));
      }
      if (global.__cacheMetrics) global.__cacheMetrics.cacheMisses.inc();

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Solo cachear respuestas 2xx
        const status = res.statusCode || 200;
        if (status >= 200 && status < 300) {
          redis.set(key, JSON.stringify(body), 'EX', duration).catch(err =>
            console.error('Error guardando en caché:', err.message)
          );
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error('Error en middleware de caché:', err.message);
      next();
    }
  };
};

/**
 * Invalida todas las claves de caché que comiencen con el prefijo dado.
 */
module.exports.invalidate = async (prefix) => {
  try {
    const stream = redis.scanStream({ match: `${prefix}*`, count: 100 });
    const pipeline = redis.pipeline();
    for await (const keys of stream) {
      keys.forEach(key => pipeline.del(key));
    }
    await pipeline.exec();
    console.log(`Caché invalidada para prefijo: ${prefix}`);
  } catch (err) {
    console.error('Error invalidando caché:', err.message);
  }
};

/**
 * Invalida las entradas de caché de un recurso concreto (por ID).
 */
module.exports.invalidateResource = async (tag, id) => {
  try {
    const listPattern = `cache:${tag}:*`;
    const listStream = redis.scanStream({ match: listPattern, count: 100 });
    const pipeline = redis.pipeline();
    for await (const keys of listStream) {
      keys.forEach(key => pipeline.del(key));
    }
    await pipeline.exec();

    if (id !== undefined && id !== null) {
      const detailPattern = `cache:${tag}:*:${id}*`;
      const detailStream = redis.scanStream({ match: detailPattern, count: 100 });
      const detailPipeline = redis.pipeline();
      for await (const keys of detailStream) {
        keys.forEach(key => detailPipeline.del(key));
      }
      await detailPipeline.exec();
    }
    console.log(`Caché invalidada para recurso ${tag}${id ? ' id=' + id : ''}`);
  } catch (err) {
    console.error('Error invalidando caché por recurso:', err.message);
  }
};
