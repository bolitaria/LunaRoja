const Action = require('../models/Action');
const Campaign = require('../models/Campaign');
const BDS = require('../models/BDS');
const Petition = require('../models/Petition');
const ColectivoAfines = require('../models/ColectivosAfines');
const Report = require('../models/Report');
const UserAction = require('../models/UserAction');
const UserCampaign = require('../models/UserCampaign');
const { Op } = require('sequelize');
const path = require('path');

const REPORTS_BASE = path.join(__dirname, '../../uploads/reports');

// Helper para filtros de fecha
const addDateFilter = (where, dateFrom, dateTo, field = 'createdAt') => {
  if (dateFrom || dateTo) {
    where[field] = {};
    if (dateFrom) where[field][Op.gte] = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where[field][Op.lte] = end;
    }
  }
  return where;
};

// Obtener todas las imágenes (galerías e principales) con filtros
exports.getAllImages = async (req, res) => {
  try {
    const { type, search, dateFrom, dateTo } = req.query;
    const user = req.user;
    const isSuperAdmin = user?.role === 'superadmin';

    const allImages = [];

    // 1. Acciones: imagen principal + galería
    if (!type || ['action', 'campaign', 'bds'].includes(type)) {
      const actionWhere = {};
      if (type === 'campaign') actionWhere.campaignId = { [Op.ne]: null };
      if (type === 'bds') actionWhere.bdsId = { [Op.ne]: null };
      if (search) actionWhere.title = { [Op.iLike]: `%${search}%` };
      if (dateFrom || dateTo) addDateFilter(actionWhere, dateFrom, dateTo, 'createdAt');

      // Restricciones de rol
      if (user?.role === 'campaign_admin') {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: user.id } });
        const campaignIds = userCampaigns.map(uc => uc.campaignId);
        if (campaignIds.length === 0) actionWhere.id = null; // fuerza vacío
        else actionWhere.campaignId = campaignIds;
      } else if (user?.role === 'action_admin') {
        const userActions = await UserAction.findAll({ where: { userId: user.id } });
        const actionIds = userActions.map(ua => ua.actionId);
        if (actionIds.length === 0) actionWhere.id = null;
        else actionWhere.id = actionIds;
      }

      const actions = await Action.findAll({
        where: actionWhere,
        attributes: ['id', 'title', 'imageUrl', 'galleryImages', 'campaignId', 'bdsId', 'createdAt'],
        order: [['createdAt', 'DESC']],
      });

      actions.forEach(action => {
        if (action.imageUrl) {
          allImages.push({
            id: `action-primary-${action.id}`,
            url: action.imageUrl,
            relatedId: action.id,
            relatedType: 'action',
            relatedTitle: action.title,
            isPrimary: true,
            createdAt: action.createdAt,
          });
        }
        if (Array.isArray(action.galleryImages)) {
          action.galleryImages.forEach((url, index) => {
            allImages.push({
              id: `action-gallery-${action.id}-${index}`,
              url,
              relatedId: action.id,
              relatedType: 'action',
              relatedTitle: action.title,
              isPrimary: false,
              createdAt: action.createdAt,
            });
          });
        }
      });
    }

    // 2. Campañas
    if (!type || type === 'campaign') {
      const where = { imageUrl: { [Op.ne]: null } };
      if (search) where.name = { [Op.iLike]: `%${search}%` };
      if (dateFrom || dateTo) addDateFilter(where, dateFrom, dateTo, 'createdAt');
      const campaigns = await Campaign.findAll({ where, attributes: ['id', 'name', 'imageUrl', 'createdAt'] });
      campaigns.forEach(c => allImages.push({
        id: `campaign-${c.id}`,
        url: c.imageUrl,
        relatedId: c.id,
        relatedType: 'campaign',
        relatedTitle: c.name,
        createdAt: c.createdAt,
      }));
    }

    // 3. BDS
    if (!type || type === 'bds') {
      const where = { imageUrl: { [Op.ne]: null } };
      if (search) where.name = { [Op.iLike]: `%${search}%` };
      if (dateFrom || dateTo) addDateFilter(where, dateFrom, dateTo, 'createdAt');
      const bdsList = await BDS.findAll({ where, attributes: ['id', 'name', 'imageUrl', 'createdAt'] });
      bdsList.forEach(b => allImages.push({
        id: `bds-${b.id}`,
        url: b.imageUrl,
        relatedId: b.id,
        relatedType: 'bds',
        relatedTitle: b.name,
        createdAt: b.createdAt,
      }));
    }

    // 4. Peticiones
    if (!type || type === 'petition') {
      const where = { imageUrl: { [Op.ne]: null } };
      if (search) where.title = { [Op.iLike]: `%${search}%` };
      if (dateFrom || dateTo) addDateFilter(where, dateFrom, dateTo, 'createdAt');
      const petitions = await Petition.findAll({ where, attributes: ['id', 'title', 'imageUrl', 'createdAt'] });
      petitions.forEach(p => allImages.push({
        id: `petition-${p.id}`,
        url: p.imageUrl,
        relatedId: p.id,
        relatedType: 'petition',
        relatedTitle: p.title,
        createdAt: p.createdAt,
      }));
    }

    // 5. Colectivos Afines
    if (!type || type === 'colectivo') {
      const where = { logoUrl: { [Op.ne]: null } };
      if (search) where.nombre = { [Op.iLike]: `%${search}%` };
      if (dateFrom || dateTo) addDateFilter(where, dateFrom, dateTo, 'createdAt');
      const colectivos = await ColectivoAfines.findAll({ where, attributes: ['id', 'nombre', 'logoUrl', 'createdAt'] });
      colectivos.forEach(c => allImages.push({
        id: `colectivo-${c.id}`,
        url: c.logoUrl,
        relatedId: c.id,
        relatedType: 'colectivo',
        relatedTitle: c.nombre,
        createdAt: c.createdAt,
      }));
    }

    // 6. Reportes (solo superadmin)
    if (!type || type === 'report') {
      if (!user || isSuperAdmin) {
        const where = {};
        if (search) where.title = { [Op.iLike]: `%${search}%` };
        if (dateFrom || dateTo) addDateFilter(where, dateFrom, dateTo, 'createdAt');
        const reports = await Report.findAll({ where, attributes: ['id', 'title', 'fileUrl', 'createdAt'] });
        reports.forEach(r => {
          if (r.fileUrl && r.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            allImages.push({
              id: `report-${r.id}`,
              url: r.fileUrl,
              relatedId: r.id,
              relatedType: 'report',
              relatedTitle: r.title,
              createdAt: r.createdAt,
            });
          }
        });
      }
    }

    allImages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(allImages);
  } catch (error) {
    console.error('Error en getAllImages:', error);
    res.status(500).json({ message: 'Error al obtener imágenes' });
  }
};

// Eliminar imagen (galería o principal)
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const isSuperAdmin = user?.role === 'superadmin';

    // --- Galería de acción: id = "action-gallery-{actionId}-{index}" ---
    if (typeof id === 'string' && id.startsWith('action-gallery-')) {
      const parts = id.split('-');
      const actionId = parseInt(parts[2], 10);
      const index = parseInt(parts[3], 10);
      if (isNaN(actionId) || isNaN(index)) return res.status(400).json({ message: 'ID inválido' });

      const action = await Action.findByPk(actionId);
      if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

      // Verificar permisos (similar a roles)
      if (!isSuperAdmin) {
        if (user?.role === 'campaign_admin') {
          const userCampaigns = await UserCampaign.findAll({ where: { userId: user.id } });
          const allowedIds = userCampaigns.map(uc => uc.campaignId);
          if (!action.campaignId || !allowedIds.includes(action.campaignId)) return res.status(403).json({ message: 'No autorizado' });
        } else if (user?.role === 'action_admin') {
          const userActions = await UserAction.findAll({ where: { userId: user.id } });
          const allowedIds = userActions.map(ua => ua.actionId);
          if (!allowedIds.includes(action.id)) return res.status(403).json({ message: 'No autorizado' });
        } else {
          return res.status(403).json({ message: 'No autorizado' });
        }
      }

      const gallery = Array.isArray(action.galleryImages) ? [...action.galleryImages] : [];
      if (index < 0 || index >= gallery.length) return res.status(404).json({ message: 'Imagen no encontrada' });

      const removedUrl = gallery.splice(index, 1)[0];
      await action.update({ galleryImages: gallery });

      // Eliminar archivo físico (opcional)
      // await deleteFileSafe(removedUrl, ACTIONS_BASE);

      return res.json({ message: 'Imagen de galería eliminada', removedUrl });
    }

    // --- Imagen principal de acción ---
    if (typeof id === 'string' && id.startsWith('action-primary-')) {
      const actionId = parseInt(id.split('-')[2], 10);
      const action = await Action.findByPk(actionId);
      if (!action) return res.status(404).json({ message: 'Acción no encontrada' });
      // (misma verificación de permisos)
      if (!isSuperAdmin) return res.status(403).json({ message: 'Solo superadmin' });
      await action.update({ imageUrl: null });
      return res.json({ message: 'Imagen principal eliminada' });
    }

    // --- Imagen principal de campaña ---
    if (typeof id === 'string' && id.startsWith('campaign-')) {
      const campaignId = parseInt(id.split('-')[1], 10);
      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) return res.status(404).json({ message: 'Campaña no encontrada' });
      if (!isSuperAdmin) return res.status(403).json({ message: 'Solo superadmin' });
      await campaign.update({ imageUrl: null });
      return res.json({ message: 'Imagen de campaña eliminada' });
    }

    // --- Imagen principal de BDS ---
    if (typeof id === 'string' && id.startsWith('bds-')) {
      const bdsId = parseInt(id.split('-')[1], 10);
      const bds = await BDS.findByPk(bdsId);
      if (!bds) return res.status(404).json({ message: 'BDS no encontrada' });
      if (!isSuperAdmin) return res.status(403).json({ message: 'Solo superadmin' });
      await bds.update({ imageUrl: null });
      return res.json({ message: 'Imagen de BDS eliminada' });
    }

    // --- Imagen de petición ---
    if (typeof id === 'string' && id.startsWith('petition-')) {
      const petitionId = id.split('-')[1];
      const petition = await Petition.findByPk(petitionId);
      if (!petition) return res.status(404).json({ message: 'Petición no encontrada' });
      if (!isSuperAdmin) return res.status(403).json({ message: 'Solo superadmin' });
      await petition.update({ imageUrl: null });
      return res.json({ message: 'Imagen de petición eliminada' });
    }

    // --- Imagen de colectivo ---
    if (typeof id === 'string' && id.startsWith('colectivo-')) {
      const colectivoId = parseInt(id.split('-')[1], 10);
      const colectivo = await ColectivoAfines.findByPk(colectivoId);
      if (!colectivo) return res.status(404).json({ message: 'Colectivo no encontrado' });
      if (!isSuperAdmin) return res.status(403).json({ message: 'Solo superadmin' });
      await colectivo.update({ logoUrl: null });
      return res.json({ message: 'Imagen de colectivo eliminada' });
    }

    // --- Imagen de reporte (solo superadmin) ---
    if (typeof id === 'string' && id.startsWith('report-')) {
      if (!isSuperAdmin) return res.status(403).json({ message: 'Solo superadmin' });
      const reportId = parseInt(id.split('-')[1], 10);
      const report = await Report.findByPk(reportId);
      if (report && report.fileUrl) {
        // deleteFileSafe(report.fileUrl, REPORTS_BASE);
        await report.update({ fileUrl: null });
        return res.json({ message: 'Archivo de reporte eliminado' });
      }
    }

    res.status(404).json({ message: 'Imagen no encontrada' });
  } catch (error) {
    console.error('Error en deleteImage:', error);
    res.status(500).json({ message: 'Error al eliminar imagen' });
  }
};