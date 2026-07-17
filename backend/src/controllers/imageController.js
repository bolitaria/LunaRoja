// src/controllers/imageController.js
const ActionImage = require('../models/ActionImage');
const Action = require('../models/Action');
const Campaign = require('../models/Campaign');
const UserAction = require('../models/UserAction');
const UserCampaign = require('../models/UserCampaign');
const Report = require('../models/Report');
const { toInt, isValidId, deleteFileSafe } = require('../utils/helpers');
const path = require('path');

const ACTIONS_BASE = path.join(__dirname, '../../uploads/actions');
const REPORTS_BASE = path.join(__dirname, '../../uploads/reports');

exports.getAllImages = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== getAllImages ===');
      console.log('req.user:', req.user ? { id: req.user.id, role: req.user.role } : 'no user');
    }

    let actionWhere = {};
    let includeAction = {
      model: Action,
      as: 'action',
      attributes: ['title', 'campaignId'],
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'color']
        }
      ]
    };

    if (req.user) {
      if (req.user.role === 'campaign_admin') {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const campaignIds = userCampaigns.map(uc => uc.campaignId);
        if (campaignIds.length === 0) return res.json([]);
        includeAction.where = { campaignId: campaignIds };
      } else if (req.user.role === 'action_admin') {
        const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
        const actionIds = userActions.map(ua => ua.actionId);
        if (actionIds.length === 0) return res.json([]);
        actionWhere.actionId = actionIds;
      }
    }

    const actionImages = await ActionImage.findAll({
      where: actionWhere,
      include: [includeAction],
      order: [['createdAt', 'DESC']]
    });

    let reportFiles = [];
    if (!req.user || req.user.role === 'superadmin') {
      try {
        const reports = await Report.findAll({
          attributes: ['id', 'title', 'fileUrl', 'createdAt']
        });
        reportFiles = reports
          .filter(r => r.fileUrl && r.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          .map(r => ({
            id: `report-${r.id}`,
            url: r.fileUrl,
            relatedId: r.id,
            relatedType: 'report',
            relatedTitle: r.title,
            createdAt: r.createdAt
          }));
      } catch (err) {
        // La tabla Reports o la columna fileUrl puede no existir todavía (migraciones pendientes)
        console.warn('Error obteniendo imágenes de reportes:', err.message);
        reportFiles = [];
      }
    }

    const allImages = [
      ...actionImages.map(img => ({
        id: img.id,
        url: img.url,
        relatedId: img.actionId,
        relatedType: 'action',
        relatedTitle: img.action ? img.action.title : 'Acción',
        campaign: img.action && img.action.campaign ? {
          id: img.action.campaign.id,
          name: img.action.campaign.name,
          color: img.action.campaign.color
        } : null,
        createdAt: img.createdAt
      })),
      ...reportFiles
    ];

    res.json(allImages);
  } catch (error) {
    console.error('Error en getAllImages:', error);
    res.status(500).json({ message: 'Error al obtener imágenes' });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Caso: imagen de acción
    const actionImage = await ActionImage.findByPk(id, {
      include: [{ model: Action, as: 'action', include: [{ model: Campaign, as: 'campaign' }] }]
    });
    if (actionImage) {
      if (req.user.role !== 'superadmin') {
        if (req.user.role === 'campaign_admin') {
          const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
          const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
          if (!actionImage.action || !allowedCampaignIds.includes(actionImage.action.campaignId)) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar esta imagen' });
          }
        } else if (req.user.role === 'action_admin') {
          const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
          const allowedActionIds = userActions.map(ua => ua.actionId);
          if (!allowedActionIds.includes(actionImage.actionId)) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar esta imagen' });
          }
        } else {
          return res.status(403).json({ message: 'Acceso denegado' });
        }
      }

      deleteFileSafe(actionImage.url, ACTIONS_BASE);
      await actionImage.destroy();
      return res.json({ message: 'Imagen de acción eliminada' });
    }

    // Caso: imagen de reporte
    if (typeof id === 'string' && id.startsWith('report-')) {
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Solo superadmin puede eliminar imágenes de reportes' });
      }
      const reportId = parseInt(id.split('-')[1]);
      if (isNaN(reportId) || reportId <= 0) {
        return res.status(400).json({ message: 'ID de reporte inválido' });
      }
      const report = await Report.findByPk(reportId);
      if (report && report.fileUrl) {
        deleteFileSafe(report.fileUrl, REPORTS_BASE);
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