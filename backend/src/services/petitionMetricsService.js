// backend/src/services/petitionMetricsService.js
const redis = require('../config/redis');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

const CACHE_KEY_PREFIX = 'metrics:petitions';
const CACHE_TTL = 300; // 5 minutos

async function getGlobalPetitionMetrics(roleWhereClause = '', roleReplacements = {}) {
  const cacheKey = `${CACHE_KEY_PREFIX}:${JSON.stringify(roleReplacements)}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const sql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE urgency = true)::int AS urgent,
        COUNT(*) FILTER (WHERE type = 'official')::int AS official,
        COUNT(*) FILTER (WHERE hidden = false)::int AS public_count,
        SUM(total_signatures)::int AS total_signatures
      FROM petitions
      ${roleWhereClause ? `WHERE ${roleWhereClause}` : ''}
    `;

    const result = await sequelize.query(sql, {
      replacements: roleReplacements,
      type: QueryTypes.SELECT,
    });

    const metrics = result[0] || { total: 0, urgent: 0, official: 0, public_count: 0, total_signatures: 0 };
    await redis.set(cacheKey, JSON.stringify(metrics), 'EX', CACHE_TTL);
    return metrics;
  } catch (error) {
    console.error('Error obteniendo métricas de peticiones:', error);
    // Fallback
    const sql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE urgency = true)::int AS urgent,
        COUNT(*) FILTER (WHERE type = 'official')::int AS official,
        COUNT(*) FILTER (WHERE hidden = false)::int AS public_count,
        SUM(total_signatures)::int AS total_signatures
      FROM petitions
      ${roleWhereClause ? `WHERE ${roleWhereClause}` : ''}
    `;
    const result = await sequelize.query(sql, {
      replacements: roleReplacements,
      type: QueryTypes.SELECT,
    });
    return result[0] || { total: 0, urgent: 0, official: 0, public_count: 0, total_signatures: 0 };
  }
}

async function invalidatePetitionMetricsCache() {
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
    console.log('Caché de métricas de peticiones invalidada');
  } catch (err) {
    console.error('Error invalidando métricas de peticiones:', err.message);
  }
}

module.exports = { getGlobalPetitionMetrics, invalidatePetitionMetricsCache };