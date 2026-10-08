// backend/src/controllers/documentController.js
const Document = require('../models/Document');
const Action = require('../models/Action');
const Campaign = require('../models/Campaign');
const BDS = require('../models/BDS');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const UserBDS = require('../models/UserBDS');
const { isValidId } = require('../utils/helpers');
const documentService = require('../services/documentService');
const { logAdminAction } = require('../services/auditService');
const cacheMiddleware = require('../middlewares/cache');

/**
 * Comprueba si un usuario tiene permiso para gestionar (ver/borrar) un documento.
 * Aplica scope por entidad:
 *   - superadmin: todo
 *   - campaign_admin: docs de sus campañas + docs de acciones de sus campañas
 *   - bds_admin:      docs de sus BDS + docs de acciones de sus BDS
 *   - action_admin:   docs de sus acciones
 *   - otros:          no
 */
async function canManageDocument(user, doc) {
  if (!user) return false;
  if (user.role === 'superadmin') return true;

  if (user.role === 'campaign_admin') {
    if (doc.campaignId) {
      const uc = await UserCampaign.findOne({ where: { userId: user.id, campaignId: doc.campaignId } });
      if (uc) return true;
    }
    if (doc.actionId) {
      const action = await Action.findByPk(doc.actionId, { attributes: ['campaignId'] });
      if (action && action.campaignId) {
        const uc = await UserCampaign.findOne({ where: { userId: user.id, campaignId: action.campaignId } });
        if (uc) return true;
      }
    }
    return false;
  }

  if (user.role === 'bds_admin') {
    if (doc.bdsId) {
      const ub = await UserBDS.findOne({ where: { userId: user.id, bdsId: doc.bdsId } });
      if (ub) return true;
    }
    if (doc.actionId) {
      const action = await Action.findByPk(doc.actionId, { attributes: ['bdsId'] });
      if (action && action.bdsId) {
        const ub = await UserBDS.findOne({ where: { userId: user.id, bdsId: action.bdsId } });
        if (ub) return true;
      }
    }
    return false;
  }

  if (user.role === 'action_admin') {
    if (doc.actionId) {
      const ua = await UserAction.findOne({ where: { userId: user.id, actionId: doc.actionId } });
      if (ua) return true;
    }
    return false;
  }

  return false;
}

/**
 * GET /api/documents
 * Lista documentos con filtros. Solo para admins autenticados.
 * Filtra por scope según rol.
 */
exports.getDocuments = async (req, res) => {
  try {
    const { actionId, campaignId, bdsId, reportId, source, visibility } = req.query;

    const where = {};
    if (actionId)   where.actionId = actionId;
    if (campaignId) where.campaignId = campaignId;
    if (bdsId)      where.bdsId = bdsId;
    if (reportId)   where.reportId = reportId;
    if (source)     where.source = source;
    if (visibility) where.visibility = visibility;

    const docs = await Document.findAll({ where, order: [['createdAt', 'DESC']] });

    // Filtrar por scope (excepto superadmin)
    if (req.user.role !== 'superadmin') {
      const allowed = [];
      for (const doc of docs) {
        if (await canManageDocument(req.user, doc)) allowed.push(doc);
      }
      return res.json(allowed);
    }

    res.json(docs);
  } catch (error) {
    console.error('Error en getDocuments:', error);
    res.status(500).json({ message: 'Error al obtener documentos' });
  }
};

/**
 * DELETE /api/documents/:id
 * Elimina un documento (fila + fichero físico si aplica).
 * Requiere scope sobre la entidad padre.
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });

    const doc = await Document.findByPk(id);
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

    const can = await canManageDocument(req.user, doc);
    if (!can) return res.status(403).json({ message: 'No tienes permiso para eliminar este documento' });

    const snapshot = {
      title: doc.title,
      source: doc.source,
      visibility: doc.visibility,
      actionId: doc.actionId,
      campaignId: doc.campaignId,
      bdsId: doc.bdsId,
      reportId: doc.reportId,
    };

    await documentService.deleteById(id);

    // Invalidar cachés del recurso padre
    if (doc.actionId)   await cacheMiddleware.invalidateResource('actions', doc.actionId);
    if (doc.campaignId) await cacheMiddleware.invalidateResource('campaigns', doc.campaignId);
    if (doc.bdsId)      await cacheMiddleware.invalidateResource('bds', doc.bdsId);
    if (doc.reportId)   await cacheMiddleware.invalidateResource('reports', doc.reportId);

    await logAdminAction(req, {
      action: 'delete',
      entityType: 'document',
      entityId: id,
      metadata: snapshot,
    });

    res.json({ message: 'Documento eliminado' });
  } catch (error) {
    console.error('Error en deleteDocument:', error);
    res.status(500).json({ message: 'Error al eliminar documento' });
  }
};
