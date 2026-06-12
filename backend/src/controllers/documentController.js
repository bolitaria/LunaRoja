const Document = require('../models/Document');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const fs = require('fs');
const path = require('path');

// Obtener documentos según permisos
exports.getDocuments = async (req, res) => {
  try {
    const { campaignId, actionId } = req.query;
    let where = {};
    if (campaignId) where.campaignId = campaignId;
    if (actionId) where.actionId = actionId;

    if (req.user && req.user.role !== 'superadmin') {
      if (req.user.role === 'campaign_admin') {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const campaignIds = userCampaigns.map(uc => uc.campaignId);
        where.campaignId = campaignIds;
      } else if (req.user.role === 'action_admin') {
        const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
        const actionIds = userActions.map(ua => ua.actionId);
        where.actionId = actionIds;
      }
    }

    const documents = await Document.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener documentos' });
  }
};

// Subir documento
exports.uploadDocument = async (req, res) => {
  try {
    const { title, description, type, campaignId, actionId } = req.body;
    if (!title || !type || (!campaignId && !actionId)) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Archivo requerido' });
    }

    // Verificar permisos
    if (req.user.role !== 'superadmin') {
      if (campaignId) {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const allowedIds = userCampaigns.map(uc => uc.campaignId);
        if (!allowedIds.includes(parseInt(campaignId))) {
          return res.status(403).json({ message: 'No tienes permiso para esta campaña' });
        }
      }
      if (actionId) {
        const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
        const allowedIds = userActions.map(ua => ua.actionId);
        if (!allowedIds.includes(parseInt(actionId))) {
          return res.status(403).json({ message: 'No tienes permiso para esta acción' });
        }
      }
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;
    const document = await Document.create({
      title,
      description,
      fileUrl,
      type,
      campaignId: campaignId || null,
      actionId: actionId || null,
    });
    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al subir documento' });
  }
};

// Eliminar documento
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
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

    const filePath = path.join(__dirname, '../../uploads/documents', path.basename(document.fileUrl));
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error al eliminar archivo:', err);
    });
    await document.destroy();
    res.json({ message: 'Documento eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar documento' });
  }
};