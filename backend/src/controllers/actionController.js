// backend/src/controllers/actionController.js
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Action = require('../models/Action');
const Campaign = require('../models/Campaign');
const BDS = require('../models/BDS');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const UserBDS = require('../models/UserBDS');
const { getGlobalMetrics } = require('../services/metricsService');
const { logAdminAction } = require('../services/auditService');
const cacheMiddleware = require('../middlewares/cache');
const storage = require('../services/storageService');
const documentService = require('../services/documentService');
const { getQueue } = require('../services/queueService');
const { toInt, isValidId } = require('../utils/helpers');

/**
 * Extrae los ficheros subidos por multer sin moverlos.
 * Los ficheros viven en /app/uploads/tmp/ y serán procesados por el
 * worker `entity-post-process`. Devuelve un objeto serializable con la
 * información mínima necesaria para el job.
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
    if (file.fieldname === 'featuredImage') {
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

  // Ordenar documentos por índice
  result.documents.sort((a, b) => {
    const aIdx = parseInt(a.file.fieldname.match(/documents\[(\d+)\]/)[1], 10);
    const bIdx = parseInt(b.file.fieldname.match(/documents\[(\d+)\]/)[1], 10);
    return aIdx - bIdx;
  });

  return result;
}

/**
 * Serializa un fichero de multer para poder enviarlo como payload de BullMQ.
 * Solo guardamos lo mínimo: path temporal, nombre, mime, tamaño.
 */
function serializeFile(file) {
  if (!file) return null;
  return {
    path: file.path,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
}

exports.getAllActions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      campaignId,
      bdsId,
      locationType,
      status,
      urgency,
      hasCampaign,
      hasPrivateDoc,
      hasPublicDoc,
      dateFrom,
      dateTo,
    } = req.query;

    const where = {};

    // Solo los admins ven acciones no publicadas (processing/error).
    // Anónimos y usuarios logados sin rol de gestión ven solo 'published'.
    const isAdmin = req.user && ['superadmin', 'campaign_admin', 'bds_admin', 'action_admin'].includes(req.user.role);
    if (!isAdmin) {
      where.status = 'published';
    }

    if (search) where.title = { [Op.iLike]: `%${search}%` };
    if (category) where.category = category;
    if (locationType) where.locationType = locationType;
    if (status === 'upcoming') where.datetime = { [Op.gte]: new Date() };
    else if (status === 'past') where.datetime = { [Op.lt]: new Date() };
    if (urgency === 'urgent') where.urgent = true;
    else if (urgency === 'not_urgent') where.urgent = false;

    // Filtros por presencia de documentos (nuevo esquema con tabla Documents)
    const extraConditions = [];
    if (hasPrivateDoc === 'true') {
      extraConditions.push(sequelize.literal(
        `"Action"."id" IN (SELECT "actionId" FROM "Documents" WHERE "actionId" IS NOT NULL AND visibility = 'admin')`
      ));
    } else if (hasPrivateDoc === 'false') {
      extraConditions.push(sequelize.literal(
        `"Action"."id" NOT IN (SELECT "actionId" FROM "Documents" WHERE "actionId" IS NOT NULL AND visibility = 'admin')`
      ));
    }

    if (hasPublicDoc === 'true') {
      extraConditions.push(sequelize.literal(
        `"Action"."id" IN (SELECT "actionId" FROM "Documents" WHERE "actionId" IS NOT NULL AND visibility = 'public')`
      ));
    } else if (hasPublicDoc === 'false') {
      extraConditions.push(sequelize.literal(
        `"Action"."id" NOT IN (SELECT "actionId" FROM "Documents" WHERE "actionId" IS NOT NULL AND visibility = 'public')`
      ));
    }

    if (extraConditions.length > 0) {
      where[Op.and] = [...(where[Op.and] || []), ...extraConditions];
    }

    if (hasCampaign === 'true') where.campaignId = { [Op.ne]: null };
    else if (hasCampaign === 'false') where.campaignId = { [Op.is]: null };

    const parsedCampaignId = toInt(campaignId);
    const parsedBdsId = toInt(bdsId);
    if (parsedCampaignId) where.campaignId = parsedCampaignId;
    if (parsedBdsId) where.bdsId = parsedBdsId;

    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) dateFilter[Op.gte] = new Date(dateFrom);
      if (dateTo) dateFilter[Op.lte] = new Date(dateTo + 'T23:59:59');
      where.datetime = dateFilter;
    }

    let roleWhereClause = '';
    let roleReplacements = {};
    if (req.user) {
      if (req.user.role === 'campaign_admin') {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const campaignIds = userCampaigns.map((uc) => uc.campaignId);
        if (campaignIds.length === 0) {
          return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit), metrics: { total: 0, upcoming: 0, past: 0, urgent: 0 } });
        }
        if (!parsedCampaignId) where.campaignId = campaignIds;
        else if (!campaignIds.includes(parsedCampaignId)) {
          return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit), metrics: { total: 0, upcoming: 0, past: 0, urgent: 0 } });
        }
        roleWhereClause = ` "campaignId" = ANY(:campaignIds) `;
        roleReplacements.campaignIds = campaignIds;
      } else if (req.user.role === 'bds_admin') {
        const userBDS = await UserBDS.findAll({ where: { userId: req.user.id } });
        const bdsIds = userBDS.map((ub) => ub.bdsId);
        if (bdsIds.length === 0) {
          return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit), metrics: { total: 0, upcoming: 0, past: 0, urgent: 0 } });
        }
        if (!parsedBdsId) where.bdsId = bdsIds;
        else if (!bdsIds.includes(parsedBdsId)) {
          return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit), metrics: { total: 0, upcoming: 0, past: 0, urgent: 0 } });
        }
        roleWhereClause = ` "bdsId" = ANY(:bdsIds) `;
        roleReplacements.bdsIds = bdsIds;
      } else if (req.user.role === 'action_admin') {
        const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
        const actionIds = userActions.map((ua) => ua.actionId);
        if (actionIds.length === 0) {
          return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit), metrics: { total: 0, upcoming: 0, past: 0, urgent: 0 } });
        }
        where.id = actionIds;
        roleWhereClause = ` "id" = ANY(:actionIds) `;
        roleReplacements.actionIds = actionIds;
      }
    }

    let parsedPage = parseInt(page) || 1;
    let parsedLimit = parseInt(limit) || 12;
    if (parsedLimit < 1) parsedLimit = 1;
    if (parsedLimit > 100) parsedLimit = 100;
    const offset = (parsedPage - 1) * parsedLimit;

    const total = await Action.count({ where });
    const rows = await Action.findAll({
      where,
      limit: parsedLimit,
      offset,
      order: [['datetime', 'DESC']],
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] },
        { model: BDS, as: 'bds', attributes: ['id', 'name', 'color'] },
      ],
      raw: true,
      nest: true,
    });

    const metrics = await getGlobalMetrics(roleWhereClause, roleReplacements);

    res.json({
      data: rows,
      total,
      page: parsedPage,
      limit: parsedLimit,
      metrics,
    });
  } catch (error) {
    console.error('Error en getAllActions:', error);
    res.status(500).json({ message: 'Error al obtener acciones' });
  }
};

exports.getActionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });

    // Solo admins pueden ver acciones en 'processing'/'error'.
    // El resto (anónimos y logados sin rol de gestión) solo ven 'published'.
    const isAdmin = req.user && ['superadmin', 'campaign_admin', 'bds_admin', 'action_admin'].includes(req.user.role);
    const where = { id };
    if (!isAdmin) where.status = 'published';

    const action = await Action.findOne({
      where,
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] },
        { model: BDS, as: 'bds', attributes: ['id', 'name', 'color'] },
      ],
    });
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });
    res.json(action);
  } catch (error) {
    console.error('Error en getActionById:', error);
    res.status(500).json({ message: 'Error al obtener acción' });
  }
};

exports.createAction = async (req, res) => {
  try {
    let {
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive, campaignId, bdsId,
      groups, documentLink, privateLink,
    } = req.body;

    const parsedCampaignId = toInt(campaignId);
    const parsedBdsId = toInt(bdsId);

    if (groups && typeof groups === 'string') {
      try { groups = JSON.parse(groups); } catch (e) { groups = null; }
    }

    if (!title || !datetime) return res.status(400).json({ message: 'Título y fecha/hora son requeridos' });
    if (locationType === 'online' && (!registrationLink || registrationLink.trim() === '')) {
      return res.status(400).json({ message: 'Para acciones online, el enlace de registro es obligatorio' });
    }

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map((uc) => uc.campaignId);
      if (!parsedCampaignId || !allowedCampaignIds.includes(parsedCampaignId)) {
        return res.status(403).json({ message: 'Debes seleccionar una campaña de las que administras' });
      }
    } else if (req.user.role === 'bds_admin') {
      const userBDS = await UserBDS.findAll({ where: { userId: req.user.id } });
      const allowedBdsIds = userBDS.map((ub) => ub.bdsId);
      if (!parsedBdsId || !allowedBdsIds.includes(parsedBdsId)) {
        return res.status(403).json({ message: 'Debes seleccionar una campaña BDS de las que administras' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para crear acciones' });
    }

    if (parsedBdsId) {
      const bdsExists = await BDS.findByPk(parsedBdsId);
      if (!bdsExists) return res.status(400).json({ message: 'La Campaña BDS indicada no existe' });
    }

    if (latitude !== undefined && latitude !== null && latitude !== '') {
      latitude = parseFloat(latitude);
      if (isNaN(latitude)) latitude = null;
    } else latitude = null;
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      longitude = parseFloat(longitude);
      if (isNaN(longitude)) longitude = null;
    } else longitude = null;

    const uploaded = collectUploadedFiles(req);

    // 1. Crear la acción en estado 'processing' (imágenes pendientes de worker)
    const action = await Action.create({
      title,
      description: description || '',
      category,
      datetime,
      locationType: locationType || 'presencial',
      onlineLink: onlineLink || '',
      placeName: placeName || '',
      address: address || '',
      latitude,
      longitude,
      registrationLink: registrationLink || '',
      recordingUrl: recordingUrl || '',
      isLive: isLive !== undefined ? isLive : true,
      campaignId: parsedCampaignId,
      bdsId: parsedBdsId,
      imageUrl: null,
      galleryImages: [],
      groups: groups || [],
      privateLink: privateLink || null,
      status: 'processing',
    });

    // 2. Enlace externo legacy (frontend antiguo): crear Document source='link'
    if (documentLink && documentLink.trim() !== '') {
      try {
        await documentService.Document.create({
          title: 'Enlace externo',
          source: 'link',
          externalUrl: documentLink.trim(),
          visibility: 'admin',
          actionId: action.id,
          uploadedBy: req.user.id,
        });
      } catch (err) {
        console.warn('[createAction] No se pudo guardar el documentLink legacy:', err.message);
      }
    }

    // 3. Encolar procesamiento async (copiar/optimizar imágenes, crear Documents, notificar)
    const hasFiles = uploaded.featuredImage || uploaded.images.length > 0 || uploaded.documents.length > 0;
    if (hasFiles) {
      await getQueue('entity-post-process').add(
        'process-entity',
        {
          entityType: 'action',
          entityId: action.id,
          userId: req.user.id,
          campaignId: parsedActionCampaign(action),
          bdsId: action.bdsId,
          featuredImage: serializeFile(uploaded.featuredImage),
          galleryImages: uploaded.images.map(serializeFile),
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
      // Sin ficheros → se puede publicar de inmediato
      await action.update({ status: 'published' });
    }

    await cacheMiddleware.invalidateResource('actions', action.id);

    await logAdminAction(req, {
      action: 'create',
      entityType: 'action',
      entityId: action.id,
      metadata: { title: action.title, category: action.category, async: hasFiles },
    });

    res.status(201).json(action);
  } catch (error) {
    console.error('Error en createAction:', error);
    res.status(500).json({ message: 'Error al crear acción' });
  }
};

// Helper interno para pasar campaignId correcto al worker
function parsedActionCampaign(action) {
  return action.campaignId;
}

exports.updateAction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const action = await Action.findByPk(id);
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    let {
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive, campaignId, bdsId,
      groups, privateLink,
    } = req.body;

    let parsedCampaignId = toInt(campaignId);
    let parsedBdsId = toInt(bdsId);

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map((uc) => uc.campaignId);
      if (!allowedCampaignIds.includes(action.campaignId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta acción' });
      }
      parsedCampaignId = action.campaignId;
    } else if (req.user.role === 'bds_admin') {
      const userBDS = await UserBDS.findAll({ where: { userId: req.user.id } });
      const allowedBdsIds = userBDS.map((ub) => ub.bdsId);
      if (!allowedBdsIds.includes(action.bdsId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta acción' });
      }
      parsedBdsId = action.bdsId;
    } else if (req.user.role === 'action_admin') {
      const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
      const allowedActionIds = userActions.map((ua) => ua.actionId);
      if (!allowedActionIds.includes(action.id)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta acción' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    if (locationType === 'online' && (!registrationLink || registrationLink.trim() === '')) {
      return res.status(400).json({ message: 'Para acciones online, el enlace de registro es obligatorio' });
    }

    if (parsedBdsId && parsedBdsId !== action.bdsId && req.user.role === 'superadmin') {
      const bdsExists = await BDS.findByPk(parsedBdsId);
      if (!bdsExists) return res.status(400).json({ message: 'La Campaña BDS indicada no existe' });
    } else if (parsedBdsId && parsedBdsId !== action.bdsId && req.user.role !== 'superadmin') {
      parsedBdsId = action.bdsId;
    }

    if (latitude !== undefined && latitude !== null && latitude !== '') {
      latitude = parseFloat(latitude);
      if (isNaN(latitude)) latitude = null;
    } else latitude = null;
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      longitude = parseFloat(longitude);
      if (isNaN(longitude)) longitude = null;
    } else longitude = null;

    if (groups && typeof groups === 'string') {
      try { groups = JSON.parse(groups); } catch (e) { groups = null; }
    }

    const uploaded = collectUploadedFiles(req);

    // 1. Actualizar metadatos inmediatamente
    await action.update({
      title: title || action.title,
      description: description !== undefined ? description : action.description,
      category: category || action.category,
      datetime: datetime || action.datetime,
      locationType: locationType || action.locationType,
      onlineLink: onlineLink !== undefined ? onlineLink : action.onlineLink,
      placeName: placeName !== undefined ? placeName : action.placeName,
      address: address !== undefined ? address : action.address,
      latitude,
      longitude,
      registrationLink: registrationLink !== undefined ? registrationLink : action.registrationLink,
      recordingUrl: recordingUrl !== undefined ? recordingUrl : action.recordingUrl,
      isLive: isLive !== undefined ? isLive : action.isLive,
      campaignId: parsedCampaignId,
      bdsId: parsedBdsId,
      groups: groups || [],
      privateLink: privateLink !== undefined ? privateLink : action.privateLink,
    });

    // 2. Si hay ficheros nuevos → encolar procesamiento async
    const hasFiles = uploaded.featuredImage || uploaded.images.length > 0 || uploaded.documents.length > 0;
    if (hasFiles) {
      await action.update({ status: 'processing', processingError: null });

      await getQueue('entity-post-process').add(
        'process-entity',
        {
          entityType: 'action',
          entityId: action.id,
          userId: req.user.id,
          campaignId: parsedCampaignId,
          bdsId: parsedBdsId,
          featuredImage: serializeFile(uploaded.featuredImage),
          galleryImages: uploaded.images.map(serializeFile),
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

    await cacheMiddleware.invalidateResource('actions', id);

    await logAdminAction(req, {
      action: 'update',
      entityType: 'action',
      entityId: id,
      metadata: { changed: Object.keys(req.body), async: hasFiles },
    });

    res.json(action);
  } catch (error) {
    console.error('Error en updateAction:', error);
    res.status(500).json({ message: 'Error al actualizar acción' });
  }
};

exports.deleteAction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const action = await Action.findByPk(id);
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar acciones' });
    }

    const snapshot = { title: action.title, category: action.category };

    // Borrar toda la carpeta /uploads/actions/{id}/ y las filas de Document asociadas
    await storage.deleteEntityDir('action', action.id);
    await documentService.deleteAllFor('action', action.id);

    await action.destroy();

    await cacheMiddleware.invalidateResource('actions', id);

    await logAdminAction(req, {
      action: 'delete',
      entityType: 'action',
      entityId: id,
      metadata: snapshot,
    });

    res.json({ message: 'Acción eliminada' });
  } catch (error) {
    console.error('Error en deleteAction:', error);
    res.status(500).json({ message: 'Error al eliminar acción' });
  }
};

exports.deleteActionImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const actionId = parseInt(req.params.id, 10);
    const action = await Action.findByPk(actionId);
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta imagen' });
    }

    const gallery = Array.isArray(action.galleryImages) ? action.galleryImages : [];
    const index = parseInt(imageId, 10);
    if (isNaN(index) || index < 0 || index >= gallery.length) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    const removedUrl = gallery.splice(index, 1)[0];
    await action.update({ galleryImages: gallery });
    await storage.deleteFile(removedUrl);

    await cacheMiddleware.invalidateResource('actions', actionId);

    await logAdminAction(req, {
      action: 'delete-image',
      entityType: 'action',
      entityId: actionId,
      metadata: { removedUrl },
    });

    res.json({ message: 'Imagen eliminada' });
  } catch (error) {
    console.error('Error en deleteActionImage:', error);
    res.status(500).json({ message: 'Error al eliminar imagen' });
  }
};
