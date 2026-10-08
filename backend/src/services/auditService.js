// backend/src/services/auditService.js
const AdminAuditLog = require('../models/AdminAuditLog');

/**
 * Registra una acción administrativa en la tabla de auditoría.
 * No lanza errores al llamador: si falla, solo loguea.
 *
 * @param {Object} req - Request de Express (para extraer usuario e IP)
 * @param {Object} params - { action, entityType, entityId, metadata }
 */
async function logAdminAction(req, { action, entityType, entityId = null, metadata = {} }) {
  try {
    const user = req.user || {};
    await AdminAuditLog.create({
      userId: user.id || null,
      username: user.username || null,
      role: user.role || null,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      metadata,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
      userAgent: req.headers['user-agent'] || null,
    });
  } catch (err) {
    console.error('Error registrando auditoría:', err.message);
  }
}

module.exports = { logAdminAction };