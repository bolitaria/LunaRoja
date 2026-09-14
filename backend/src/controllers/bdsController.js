// backend/src/controllers/bdsController.js
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const BDS = require('../models/BDS');
const UserBDS = require('../models/UserBDS');
const { notifyNewCampaign } = require('../services/notificationService');
const { getGlobalBDSMetrics } = require('../services/bdsMetricsService');
const { logAdminAction } = require('../services/auditService');
const cacheMiddleware = require('../middlewares/cache');
const { toInt, isValidId } = require('../utils/helpers');
const { getQueue } = require('../services/queueService');
const storage = require('../services/storageService');
const documentService = require('../services/documentService');

function collectUploadedFiles(req) {
  const files = req.files || [];
  const result = { featuredImage: null, images: [], documents: [] };

  const docNames = {};
  const docIsPublic = {};
  Object.keys(req.body).forEach((key) => {
    const matchName = key.match(/documents\[(\d+)\]\[name\]/);
    if (matchName) docNames[parseInt(matchName[1], 10)] = req.body[key];
    const matchPublic = key.match(/documents\[(\d+)\]\[isPublic\]/);
    if (matchPublic) docIsPublic[parseInt(matchPublic[1], 10)] = req.body[key] === 'true';
  });

  files.forEach((file) => {
    if (file.fieldname === 'featuredImage' || file.fieldname === 'image') {
      result.featuredImage = file;
    } else if (file.fieldname === 'images' || file.fieldname === 'images[]') {
      result.images.push(file);
    } else if (file.fieldname && file.fieldname.startsWith('documents[')) {
      const match = file.fieldname.match(/documents\[(\d+)\]\[file\]/);
      if (match) {
        const idx = parseInt(match[1], 10);
        result.documents.push({
          file,
          name: docNames[idx] || file.originalname,
          visibility: docIsPublic[idx] ? 'public' : 'admin',
        });
      }
    }
  });

  result.documents.sort((a, b) => {
    const aIdx = parseInt(a.file.fieldname.match(/documents\[(\d+)\]/)[1], 10);
    const bIdx = parseInt(b.file.fieldname.match(/documents\[(\d+)\]/)[1], 10);
    return aIdx - bIdx;
  });

  return result;
}

function serializeFile(file) {
  if (!file) return null;
  return {
    path: file.path,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
}

exports.getAllBDS = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      hasActions,
      actionCategory,
      urgency,
      visibility,
      hasPublicDoc,
      hasPrivateDoc,
      dateFrom,
      dateTo,
    } = req.query;

    const conditions = [];
    const replacements = {};

    if (!req.user) conditions.push(`b.status = 'published'`);

    if (search) {
      conditions.push(`(b.name ILIKE :search OR b.description ILIKE :search)`);
      replacements.search = `%${search}%`;
    }

    if (hasActions === 'true') conditions.push(`EXISTS (SELECT 1 FROM "Actions" a WHERE a."bdsId" = b.id)`);
    else if (hasActions === 'false') conditions.push(`NOT EXISTS (SELECT 1 FROM "Actions" a WHERE a."bdsId" = b.id)`);

    if (actionCategory) {
      conditions.push(`EXISTS (SELECT 1 FROM "Actions" a WHERE a."bdsId" = b.id AND a.category = :actionCategory)`);
      replacements.actionCategory = actionCategory;
    }

    if (urgency === 'urgent') conditions.push(`EXISTS (SELECT 1 FROM "Actions" a WHERE a."bdsId" = b.id AND a.urgent = true)`);
    else if (urgency === 'not_urgent') conditions.push(`NOT EXISTS (SELECT 1 FROM "Actions" a WHERE a."bdsId" = b.id AND a.urgent = true)`);

    if (hasPublicDoc === 'true') {
      conditions.push(`EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id AND d.visibility = 'public')`);
    } else if (hasPublicDoc === 'false') {
      conditions.push(`NOT EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id AND d.visibility = 'public')`);
    }

    if (hasPrivateDoc === 'true') {
      conditions.push(`EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id AND d.visibility = 'admin')`);
    } else if (hasPrivateDoc === 'false') {
      conditions.push(`NOT EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id AND d.visibility = 'admin')`);
    }

    if (visibility === 'public') {
      conditions.push(`EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id AND d.visibility = 'public')`);
      conditions.push(`NOT EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id AND d.visibility = 'admin')`);
    } else if (visibility === 'private') {
      conditions.push(`EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id AND d.visibility = 'admin')`);
      conditions.push(`NOT EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id AND d.visibility = 'public')`);
    } else if (visibility === 'both') {
      conditions.push(`EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id AND d.visibility = 'public')`);
      conditions.push(`EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id AND d.visibility = 'admin')`);
    } else if (visibility === 'none') {
      conditions.push(`NOT EXISTS (SELECT 1 FROM "Documents" d WHERE d."bdsId" = b.id)`);
    }

    if (dateFrom) { conditions.push(`b."createdAt" >= :dateFrom`); replacements.dateFrom = new Date(dateFrom); }
    if (dateTo) { conditions.push(`b."createdAt" <= :dateTo`); replacements.dateTo = new Date(dateTo + 'T23:59:59'); }

    let roleWhereClause = '';
    let roleReplacements = {};
    if (req.user) {
      if (req.user.role === 'bds_admin') {
        const userBDS = await UserBDS.findAll({ where: { userId: req.user.id } });
        const ids = userBDS.map(ub => ub.bdsId);
        if (ids.length === 0) {
          return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit), metrics: { total: 0, urgent: 0, public_count: 0, private_count: 0 } });
        }
        conditions.push(`b.id = ANY(:bdsIds)`);
        replacements.bdsIds = ids;
        roleWhereClause = ` b.id = ANY(:bdsIds) `;
        roleReplacements.bdsIds = ids;
      } else if (req.user.role === 'action_admin') {
        return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit), metrics: { total: 0, urgent: 0, public_count: 0, private_count: 0 } });
      }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = Math.min(parseInt(limit) || 12, 1000);
    const offset = (parsedPage - 1) * parsedLimit;

    const sql = `
      SELECT
        b.*,
        COALESCE(sc.cnt, 0)::int AS "subscriberCount",
        COALESCE(ac.cnt, 0)::int AS "actionCount",
        COALESCE(ac.urgent_cnt, 0)::int AS "urgentActionCount"
      FROM "BDSs" b
      LEFT JOIN (
        SELECT "bdsId", COUNT(*)::int AS cnt FROM "SubscriberCampaigns"
        WHERE "bdsId" IS NOT NULL GROUP BY "bdsId"
      ) sc ON sc."bdsId" = b.id
      LEFT JOIN (
        SELECT "bdsId", COUNT(*)::int AS cnt,
               COUNT(*) FILTER (WHERE urgent)::int AS urgent_cnt
        FROM "Actions" WHERE "bdsId" IS NOT NULL GROUP BY "bdsId"
      ) ac ON ac."bdsId" = b.id
      ${whereClause}
      ORDER BY b."createdAt" DESC
      LIMIT :limit OFFSET :offset
    `;

    const countSql = `SELECT COUNT(*)::int AS total FROM "BDSs" b ${whereClause}`;

    const [rows, countResult] = await Promise.all([
      sequelize.query(sql, { replacements: { ...replacements, limit: parsedLimit, offset }, type: QueryTypes.SELECT }),
      sequelize.query(countSql, { replacements, type: QueryTypes.SELECT }),
    ]);

    const total = countResult[0]?.total || 0;
    const metrics = await getGlobalBDSMetrics(roleWhereClause, roleReplacements);

    res.json({ data: rows, total, page: parsedPage, limit: parsedLimit, metrics });
  } catch (error) {
    console.error('Error en getAllBDS:', error);
    res.status(500).json({ message: 'Error al obtener BDS' });
  }
};

exports.getBDSById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });

    const sql = `
      SELECT
        b.*,
        COALESCE(sc.cnt, 0)::int AS "subscriberCount",
        COALESCE(ac.cnt, 0)::int AS "actionCount",
        COALESCE(ac.urgent_cnt, 0)::int AS "urgentActionCount"
      FROM "BDSs" b
      LEFT JOIN (
        SELECT "bdsId", COUNT(*)::int AS cnt
        FROM "SubscriberCampaigns"
        WHERE "bdsId" IS NOT NULL
        GROUP BY "bdsId"
      ) sc ON sc."bdsId" = b.id
      LEFT JOIN (
        SELECT "bdsId", COUNT(*)::int AS cnt,
               COUNT(*) FILTER (WHERE urgent)::int AS urgent_cnt
        FROM "Actions"
        WHERE "bdsId" IS NOT NULL
        GROUP BY "bdsId"
      ) ac ON ac."bdsId" = b.id
      WHERE b.id = :id
      LIMIT 1
    `;

    const rows = await sequelize.query(sql, { replacements: { id }, type: QueryTypes.SELECT });

    if (!rows.length) return res.status(404).json({ message: 'BDS no encontrada' });

    const isAdmin = req.user && ['superadmin', 'bds_admin'].includes(req.user.role);
    const documents = await documentService.listFor({
      entityType: 'bds',
      entityId: id,
      includeAdmin: isAdmin,
    });

    res.json({ ...rows[0], documents });
  } catch (error) {
    console.error('Error en getBDSById:', error);
    res.status(500).json({ message: 'Error al obtener BDS' });
  }
};

exports.createBDS = async (req, res) => {
  try {
    let { name, description, color, groups } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });

    if (groups && typeof groups === 'string') {
      try { groups = JSON.parse(groups); } catch (e) { groups = []; }
    }
    if (!Array.isArray(groups)) groups = [];

    const uploaded = collectUploadedFiles(req);

    const bds = await BDS.create({
      name,
      description: description || '',
      color: color || '#E53E3E',
      imageUrl: null,
      groups,
      status: 'processing',
    });

    const hasFiles = uploaded.featuredImage || uploaded.documents.length > 0;
    if (hasFiles) {
      await getQueue('entity-post-process').add(
        'process-entity',
        {
          entityType: 'bds',
          entityId: bds.id,
          userId: req.user.id,
          featuredImage: serializeFile(uploaded.featuredImage),
          galleryImages: [],
          documents: uploaded.documents.map((d) => ({
            ...serializeFile(d.file),
            name: d.name,
            visibility: d.visibility,
          })),
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 },
          removeOnComplete: true,
          removeOnFail: { age: 86400 },
        }
      );
    } else {
      await bds.update({ status: 'published' });
    }

    // Notificar a suscriptores que siguen BDS (fire-and-forget)
    notifyNewCampaign(bds, 'bds').catch((err) => console.error('Error notificando BDS:', err));

    await cacheMiddleware.invalidateResource('bds', bds.id);

    await logAdminAction(req, {
      action: 'create',
      entityType: 'bds',
      entityId: bds.id,
      metadata: { name: bds.name, async: hasFiles },
    });

    res.status(201).json(bds);
  } catch (error) {
    console.error('Error en createBDS:', error);
    res.status(500).json({ message: 'Error al crear BDS' });
  }
};

exports.updateBDS = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const bds = await BDS.findByPk(id);
    if (!bds) return res.status(404).json({ message: 'BDS no encontrada' });

    if (req.user.role === 'bds_admin') {
      const userBDS = await UserBDS.findAll({ where: { userId: req.user.id } });
      const allowedIds = userBDS.map(u => u.bdsId);
      if (!allowedIds.includes(bds.id)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta BDS' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    let { name, description, color, groups } = req.body;
    if (groups && typeof groups === 'string') {
      try { groups = JSON.parse(groups); } catch (e) { groups = null; }
    }

    const uploaded = collectUploadedFiles(req);

    await bds.update({
      name: name !== undefined ? name : bds.name,
      description: description !== undefined ? description : bds.description,
      color: color || bds.color,
      groups: groups !== undefined ? groups : bds.groups,
    });

    const hasFiles = uploaded.featuredImage || uploaded.documents.length > 0;
    if (hasFiles) {
      await bds.update({ status: 'processing', processingError: null });
      await getQueue('entity-post-process').add(
        'process-entity',
        {
          entityType: 'bds',
          entityId: bds.id,
          userId: req.user.id,
          featuredImage: serializeFile(uploaded.featuredImage),
          galleryImages: [],
          documents: uploaded.documents.map((d) => ({
            ...serializeFile(d.file),
            name: d.name,
            visibility: d.visibility,
          })),
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 },
          removeOnComplete: true,
          removeOnFail: { age: 86400 },
        }
      );
    }

    await cacheMiddleware.invalidateResource('bds', id);

    await logAdminAction(req, {
      action: 'update',
      entityType: 'bds',
      entityId: id,
      metadata: { changed: Object.keys(req.body), async: hasFiles },
    });

    res.json(bds);
  } catch (error) {
    console.error('Error en updateBDS:', error);
    res.status(500).json({ message: 'Error al actualizar BDS' });
  }
};

exports.deleteBDS = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const bds = await BDS.findByPk(id);
    if (!bds) return res.status(404).json({ message: 'BDS no encontrada' });

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar BDS' });
    }

    const snapshot = { name: bds.name };

    await storage.deleteEntityDir('bds', bds.id);
    await documentService.deleteAllFor('bds', bds.id);
    await bds.destroy();

    await cacheMiddleware.invalidateResource('bds', id);

    await logAdminAction(req, {
      action: 'delete',
      entityType: 'bds',
      entityId: id,
      metadata: snapshot,
    });

    res.json({ message: 'BDS eliminada' });
  } catch (error) {
    console.error('Error en deleteBDS:', error);
    res.status(500).json({ message: 'Error al eliminar BDS' });
  }
};
