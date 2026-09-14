// backend/src/services/metricsService.js
const redis = require('../config/redis');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

const CACHE_KEY_PREFIX = 'metrics:actions';
const CACHE_TTL = 300; // 5 minutos

async function getGlobalMetrics(roleWhereClause = '', roleReplacements = {}) {
  const cacheKey = `${CACHE_KEY_PREFIX}:${JSON.stringify(roleReplacements)}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const sql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE datetime >= NOW())::int AS upcoming,
        COUNT(*) FILTER (WHERE datetime < NOW())::int AS past,
        COUNT(*) FILTER (WHERE urgent = true)::int AS urgent
      FROM "Actions"
      ${roleWhereClause ? `WHERE ${roleWhereClause}` : ''}
    `;

    const result = await sequelize.query(sql, {
      replacements: roleReplacements,
      type: QueryTypes.SELECT,
    });

    const metrics = result[0] || { total: 0, upcoming: 0, past: 0, urgent: 0 };

    await redis.set(cacheKey, JSON.stringify(metrics), 'EX', CACHE_TTL);
    return metrics;
  } catch (error) {
    console.error('Error obteniendo métricas globales:', error);
    // Fallback: calcular sin caché
    const sql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE datetime >= NOW())::int AS upcoming,
        COUNT(*) FILTER (WHERE datetime < NOW())::int AS past,
        COUNT(*) FILTER (WHERE urgent = true)::int AS urgent
      FROM "Actions"
      ${roleWhereClause ? `WHERE ${roleWhereClause}` : ''}
    `;
    const result = await sequelize.query(sql, {
      replacements: roleReplacements,
      type: QueryTypes.SELECT,
    });
    return result[0] || { total: 0, upcoming: 0, past: 0, urgent: 0 };
  }
}

async function invalidateMetricsCache() {
  try {
    const stream = redis.scanStream({
      match: `${CACHE_KEY_PREFIX}:*`,
      count: 100,
    });
    const pipeline = redis.pipeline();
    for await (const keys of stream) {
      keys.forEach(key => pipeline.del(key));
    }
    await pipeline.exec();
    console.log('Caché de métricas invalidada');
  } catch (err) {
    console.error('Error invalidando métricas:', err.message);
  }
}

module.exports = { getGlobalMetrics, invalidateMetricsCache };