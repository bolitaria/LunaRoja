// backend/src/controllers/campaignController.js
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const Campaign = require('../models/Campaign');
const UserCampaign = require('../models/UserCampaign');
const { isValidId } = require('../utils/helpers');
const { getQueue } = require('../services/queueService');
const { getGlobalCampaignMetrics } = require('../services/campaignMetricsService');
const { logAdminAction } = require('../services/auditService');
const cacheMiddleware = require('../middlewares/cache');
const documentService = require('../services/documentService');

/**
 * Extrae los ficheros subidos por multer para una entidad.
 * Contrato: featuredImage, images[], documents[N][...].
 * Reutilizable por cualquier controller con uploads.
 */
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

exports.getAllCampaigns = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      actionCategory,
      hasActions,
      urgency,
      visibility,
      hasPublicDoc,
      hasPrivateDoc,
      dateFrom,
      dateTo,
    } = req.query;

    const conditions = [];
    const replacements = {};

    // Los usuarios anónimos solo ven campañas publicadas
    if (!req.user) conditions.push(`c.status = 'published'`);

    if (search) {
      conditions.push(`(c.name ILIKE :search OR c.description ILIKE :search)`);
      replacements.search = `%${search}%`;
    }

    if (hasActions === 'true') {
      conditions.push(`EXISTS (SELECT 1 FROM "Actions" a WHERE a."campaignId" = c.id)`);
    } else if (hasActions === 'false') {
      conditions.push(`NOT EXISTS (SELECT 1 FROM "Actions" a WHERE a."campaignId" = c.id)`);
    }

    if (actionCategory) {
      conditions.push(`EXISTS (SELECT 1 FROM "Actions" a WHERE a."campaignId" = c.id AND a.category = :actionCategory)`);
      replacements.actionCategory = actionCategory;
    }

    if (urgency === 'urgent') {
      conditions.push(`EXISTS (SELECT 1 FROM "Actions" a WHERE a."campaignId" = c.id AND a.urgent = true)`);
    } else if (urgency === 'not_urgent') {
      conditions.push(`NOT EXISTS (SELECT 1 FROM "Actions" a WHERE a."campaignId" = c.id AND a.urgent = true)`);
    }

    // Filtros de documentos → tabla Documents
    if (hasPublicDoc === 'true') {
      conditions.push(`EXISTS (SELECT 1 FROM "Documents" d WHERE d."campaignId" = c.id AND d.visibility = 'public')`);
    } else if (hasPublicDoc === 'false') {
      conditions.push(`NOT EXISTS (SELECT 1 FROM "Documents" d WHERE d."campaignId" = c.id AND d.visibility = 'public')`);
    }

    if (hasPrivateDoc === 'true') {
      conditions.push(`EXISTS (SELECT 1 FROM "Documents" d WHERE d."campaignId" = c.id AND d.visibility = 'admin')`);
    } else if (hasPrivateDoc === 'false') {
      conditions.push(`NOT EXISTS (SELECT 1 FROM "Documents" d WHERE d."campaignId" = c.id AND d.visibility = 'admin')`);
    }

    if (visibility === 'public') {
      conditions.push(`EXISTS (SELECT 1 FROM "Documents" d WHERE d."campaignId" = c.id AND d.visibility = 'public')`);
      conditions.push(`NOT EXISTS (SELECT 1 FROM "Documents" d WHERE d."campaignId" = c.id AND d.visibility = 'admin')`);
    } else if (visibility === 'private') {
      conditions.push(`EXISTS (SELECT 1 FROM "Documents" d WHERE d."campaignId" = c.id AND d.visibility = 'admin')`);
      conditions.push(`NOT EXISTS (SELECT 1 FROM "Documents" d WHERE d."campaignId" = c.id AND d.visibility = 'public')`);
    } else if (visibility === 'both') {
      conditions.push(`EXISTS (SELECT 1 FROM "Documents" d WHERE d."campaignId" = c.id AND d.visibility = 'public')`);
      conditions.push(`EXISTS (SELECT 1 FROM "Documents" d WHERE d."campaignId" = c.id AND d.visibility = 'admin')`);
    } else if (visibility === 'none') {
      conditions.push(`NOT EXISTS (SELECT 1 FROM "Documents" d WHERE d."campaignId" = c.id)`);
    }

    if (dateFrom) { conditions.push(`c."createdAt" >= :dateFrom`); replacements.dateFrom = new Date(dateFrom); }
    if (dateTo) { conditions.push(`c."createdAt" <= :dateTo`); replacements.dateTo = new Date(dateTo + 'T23:59:59'); }

    let roleWhereClause = '';
    let roleReplacements = {};
    if (req.user) {
      if (req.user.role === 'campaign_admin') {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id }, attributes: ['campaignId'] });
        const ids = userCampaigns.map(uc => uc.campaignId);
        if (ids.length === 0) {
          return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit), metrics: { total: 0, urgent: 0, public_count: 0, private_count: 0 } });
        }
        conditions.push(`c.id = ANY(:campaignIds)`);
        replacements.campaignIds = ids;
        roleWhereClause = ` c.id = ANY(:campaignIds) `;
        roleReplacements.campaignIds = ids;
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
        c.*,
        COALESCE(sc.cnt, 0)::int AS "subscriberCount",
        COALESCE(ac.cnt, 0)::int AS "actionCount",
        COALESCE(ac.urgent_cnt, 0)::int AS "urgentActionCount"
      FROM "Campaigns" c
      LEFT JOIN (
        SELECT "entityId" AS "campaignId", COUNT(*)::int AS cnt FROM "SubscriberCampaigns" WHERE "entityType" = 'campaign' GROUP BY "entityId"
      ) sc ON sc."campaignId" = c.id
      LEFT JOIN (
        SELECT "campaignId", COUNT(*)::int AS cnt,
               COUNT(*) FILTER (WHERE urgent)::int AS urgent_cnt
        FROM "Actions" GROUP BY "campaignId"
      ) ac ON ac."campaignId" = c.id
      ${whereClause}
      ORDER BY c."createdAt" DESC
      LIMIT :limit OFFSET :offset
    `;

    const countSql = `SELECT COUNT(*)::int AS total FROM "Campaigns" c ${whereClause}`;

    const [rows, countResult] = await Promise.all([
      sequelize.query(sql, { replacements: { ...replacements, limit: parsedLimit, offset }, type: QueryTypes.SELECT }),
      sequelize.query(countSql, { replacements, type: QueryTypes.SELECT }),
    ]);

    const total = countResult[0]?.total || 0;
    const metrics = await getGlobalCampaignMetrics(roleWhereClause, roleReplacements);

    res.json({ data: rows, total, page: parsedPage, limit: parsedLimit, metrics });
  } catch (error) {
    console.error('Error en getAllCampaigns:', error);
    res.status(500).json({ message: 'Error al obtener campañas' });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });

    const sql = `
      SELECT
        c.*,
        COALESCE(sc.cnt, 0)::int AS "subscriberCount",
        COALESCE(ac.cnt, 0)::int AS "actionCount",
        COALESCE(ac.urgent_cnt, 0)::int AS "urgentActionCount"
      FROM "Campaigns" c
      LEFT JOIN (
        SELECT "entityId" AS "campaignId", COUNT(*)::int AS cnt
        FROM "SubscriberCampaigns"
        WHERE "entityType" = 'campaign'
        GROUP BY "entityId"
      ) sc ON sc."campaignId" = c.id
      LEFT JOIN (
        SELECT "campaignId", COUNT(*)::int AS cnt,
               COUNT(*) FILTER (WHERE urgent)::int AS urgent_cnt
        FROM "Actions"
        GROUP BY "campaignId"
      ) ac ON ac."campaignId" = c.id
      WHERE c.id = :id
      LIMIT 1
    `;

    const rows = await sequelize.query(sql, { replacements: { id }, type: QueryTypes.SELECT });

    if (!rows.length) return res.status(404).json({ message: 'Campaña no encontrada' });

    // Cargar documentos (solo públicos para no-admins)
    const isAdmin = req.user && ['superadmin', 'campaign_admin'].includes(req.user.role);
    const documents = await documentService.listFor({
      entityType: 'campaign',
      entityId: id,
      includeAdmin: isAdmin,
    });

    res.json({ ...rows[0], documents });
  } catch (error) {
    console.error('Error en getCampaignById:', error);
    res.status(500).json({ message: 'Error al obtener campaña' });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    let { name, description, color, groups, privateLink } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });

    if (groups && typeof groups === 'string') {
      try { groups = JSON.parse(groups); } catch (e) { groups = null; }
    }

    const uploaded = collectUploadedFiles(req);

    const campaign = await Campaign.create({
      name,
      description: description || '',
      color: color || '#E53E3E',
      imageUrl: null,
      groups: groups || [],
      privateLink: privateLink || null,
      status: 'processing',
    });

    const hasFiles = uploaded.featuredImage || uploaded.documents.length > 0;
    if (hasFiles) {
      await getQueue('entity-post-process').add(
        'process-entity',
        {
          entityType: 'campaign',
          entityId: campaign.id,
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
      await campaign.update({ status: 'published' });
    }

    await cacheMiddleware.invalidateResource('campaigns', campaign.id);

    await logAdminAction(req, {
      action: 'create',
      entityType: 'campaign',
      entityId: campaign.id,
      metadata: { name: campaign.name, async: hasFiles },
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error en createCampaign:', error);
    res.status(500).json({ message: 'Error al crear campaña' });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const campaign = await Campaign.findByPk(id);
    if (!campaign) return res.status(404).json({ message: 'Campaña no encontrada' });

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedIds = userCampaigns.map(uc => uc.campaignId);
      if (!allowedIds.includes(campaign.id)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta campaña' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    let { name, description, color, groups, privateLink } = req.body;
    if (groups && typeof groups === 'string') {
      try { groups = JSON.parse(groups); } catch (e) { groups = null; }
    }

    const uploaded = collectUploadedFiles(req);

    // Metadatos sync
    await campaign.update({
      name: name || campaign.name,
      description: description !== undefined ? description : campaign.description,
      color: color || campaign.color,
      groups: groups || [],
      privateLink: privateLink !== undefined ? privateLink : campaign.privateLink,
    });

    // Ficheros async
    const hasFiles = uploaded.featuredImage || uploaded.documents.length > 0;
    if (hasFiles) {
      await campaign.update({ status: 'processing', processingError: null });
      await getQueue('entity-post-process').add(
        'process-entity',
        {
          entityType: 'campaign',
          entityId: campaign.id,
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

    await cacheMiddleware.invalidateResource('campaigns', id);

    await logAdminAction(req, {
      action: 'update',
      entityType: 'campaign',
      entityId: id,
      metadata: { changed: Object.keys(req.body), async: hasFiles },
    });

    res.json(campaign);
  } catch (error) {
    console.error('Error en updateCampaign:', error);
    res.status(500).json({ message: 'Error al actualizar campaña' });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const campaign = await Campaign.findByPk(id);
    if (!campaign) return res.status(404).json({ message: 'Campaña no encontrada' });

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar campañas' });
    }

    const snapshot = { name: campaign.name };

    const storage = require('../services/storageService');
    await storage.deleteEntityDir('campaign', campaign.id);
    await documentService.deleteAllFor('campaign', campaign.id);

    await campaign.destroy();

    await cacheMiddleware.invalidateResource('campaigns', id);

    await logAdminAction(req, {
      action: 'delete',
      entityType: 'campaign',
      entityId: id,
      metadata: snapshot,
    });

    res.json({ message: 'Campaña eliminada' });
  } catch (error) {
    console.error('Error en deleteCampaign:', error);
    res.status(500).json({ message: 'Error al eliminar campaña' });
  }
};
