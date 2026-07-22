const Document = require('../models/Document');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const { toInt, isValidId, deleteFileSafe } = require('../utils/helpers');
const path = require('path');

const DOCUMENTS_BASE = path.join(__dirname, '../../uploads/documents');

// Obtener documentos según permisos
exports.getDocuments = async (req, res) => {
  try {
    const { campaignId, actionId } = req.query;
    let where = {};
    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);

    if (parsedCampaignId) where.campaignId = parsedCampaignId;
    if (parsedActionId) where.actionId = parsedActionId;

    if (req.user && req.user.role !== 'superadmin') {
      if (req.user.role === 'campaign_admin') {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const campaignIds = userCampaigns.map(uc => uc.campaignId);
        if (campaignIds.length === 0) return res.json([]);
        where.campaignId = campaignIds;
      } else if (req.user.role === 'action_admin') {
        const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
        const actionIds = userActions.map(ua => ua.actionId);
        if (actionIds.length === 0) return res.json([]);
        where.actionId = actionIds;
      }
    }

    const documents = await Document.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(documents);
  } catch (error) {
    console.error('Error en getDocuments:', error);
    res.status(500).json({ message: 'Error al obtener documentos' });
  }
};

// Subir documento
exports.uploadDocument = async (req, res) => {
  try {
    const { title, description, type, campaignId, actionId } = req.body;
    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);

    if (!title || !type || (!parsedCampaignId && !parsedActionId)) {
      return res.status(400).json({ message: 'Faltan campos requeridos (título, tipo, y campaña o acción)' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Archivo requerido' });
    }

    // Verificar permisos
    if (req.user.role !== 'superadmin') {
      if (parsedCampaignId) {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const allowedIds = userCampaigns.map(uc => uc.campaignId);
        if (!allowedIds.includes(parsedCampaignId)) {
          return res.status(403).json({ message: 'No tienes permiso para esta campaña' });
        }
      }
      if (parsedActionId) {
        const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
        const allowedIds = userActions.map(ua => ua.actionId);
        if (!allowedIds.includes(parsedActionId)) {
          return res.status(403).json({ message: 'No tienes permiso para esta acción' });
        }
      }
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;
    const document = await Document.create({
      title,
      description: description || '',
      fileUrl,
      type,
      campaignId: parsedCampaignId,
      actionId: parsedActionId,
    });
    res.status(201).json(document);
  } catch (error) {
    console.error('Error en uploadDocument:', error);
    res.status(500).json({ message: 'Error al subir documento' });
  }
};

// Eliminar documento
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const document = await Document.findByPk(id);
    if (!document) return res.status(404).json({ message: 'Documento no encontrado' });

    if (req.user.role !== 'superadmin') {
      if (document.campaignId) {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const allowedIds = userCampaigns.map(uc => uc.campaignId);
        if (!allowedIds.includes(document.campaignId)) {
          return res.status(403).json({ message: 'No tienes permiso' });
        }
      } else if (document.actionId) {
        const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
        const allowedIds = userActions.map(ua => ua.actionId);
        if (!allowedIds.includes(document.actionId)) {
          return res.status(403).json({ message: 'No tienes permiso' });
        }
      } else {
        return res.status(403).json({ message: 'No tienes permiso' });
      }
    }

    // Eliminar archivo de forma segura
    deleteFileSafe(document.fileUrl, DOCUMENTS_BASE);
    await document.destroy();
    res.json({ message: 'Documento eliminado' });
  } catch (error) {
    console.error('Error en deleteDocument:', error);
    res.status(500).json({ message: 'Error al eliminar documento' });
  }
};