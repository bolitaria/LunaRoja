// backend/src/services/bdsMetricsService.js
const redis = require('../config/redis');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

const CACHE_KEY_PREFIX = 'metrics:bds';
const CACHE_TTL = 300;

/**
 * Métricas globales de BDS. Cuenta:
 *  - total
 *  - urgent: BDS con alguna acción urgente
 *  - public_count: BDS con al menos 1 documento público en `Documents`
 *  - private_count: BDS con al menos 1 documento admin en `Documents`
 */
async function getGlobalBDSMetrics(roleWhereClause = '', roleReplacements = {}) {
  const cacheKey = `${CACHE_KEY_PREFIX}:${JSON.stringify(roleReplacements)}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const sql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE EXISTS (SELECT 1 FROM "Actions" a WHERE a."bdsId" = b.id AND a.urgent = true)
        )::int AS urgent,
        COUNT(*) FILTER (
          WHERE EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id AND d.visibility = 'public')
        )::int AS public_count,
        COUNT(*) FILTER (
          WHERE EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id AND d.visibility = 'admin')
        )::int AS private_count
      FROM "BDSs" b
      ${roleWhereClause ? `WHERE ${roleWhereClause}` : ''}
    `;

    const result = await sequelize.query(sql, {
      replacements: roleReplacements,
      type: QueryTypes.SELECT,
    });

    const metrics = result[0] || { total: 0, urgent: 0, public_count: 0, private_count: 0 };
    await redis.set(cacheKey, JSON.stringify(metrics), 'EX', CACHE_TTL);
    return metrics;
  } catch (error) {
    console.error('Error obteniendo métricas de BDS:', error.message);
    const fallbackSql = `
      SELECT
        COUNT(*)::int AS total,
        0::int AS urgent,
        0::int AS public_count,
        0::int AS private_count
      FROM "BDSs" b
      ${roleWhereClause ? `WHERE ${roleWhereClause}` : ''}
    `;
    try {
      const result = await sequelize.query(fallbackSql, {
        replacements: roleReplacements,
        type: QueryTypes.SELECT,
      });
      return result[0] || { total: 0, urgent: 0, public_count: 0, private_count: 0 };
    } catch (err2) {
      console.error('Error en fallback de métricas de BDS:', err2.message);
      return { total: 0, urgent: 0, public_count: 0, private_count: 0 };
    }
  }
}

async function invalidateBDSMetricsCache() {
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
    console.log('Caché de métricas de BDS invalidada');
  } catch (err) {
    console.error('Error invalidando métricas de BDS:', err.message);
  }
}

module.exports = { getGlobalBDSMetrics, invalidateBDSMetricsCache };
