const Campaign = require('../models/Campaign');
const UserCampaign = require('../models/UserCampaign');
const Subscriber = require('../models/Subscriber');
const { sendCampaignNotification } = require('../services/emailService');
const { toInt, isValidId, deleteFileSafe } = require('../utils/helpers');
const path = require('path');

const CAMPAIGNS_BASE = path.join(__dirname, '../../uploads/campaigns');
const DOCUMENTS_BASE = path.join(__dirname, '../../uploads/documents');

exports.getAllCampaigns = async (req, res) => {
  try {
    let where = {};
    if (req.user) {
      if (req.user.role === 'campaign_admin') {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const campaignIds = userCampaigns.map(uc => uc.campaignId);
        if (campaignIds.length === 0) return res.json([]);
        where.id = campaignIds;
      } else if (req.user.role === 'action_admin') {
        return res.json([]);
      }
    }
    const campaigns = await Campaign.findAll({ where, order: [['name', 'ASC']] });
    res.json(campaigns);
  } catch (error) {
    console.error('Error en getAllCampaigns:', error);
    res.status(500).json({ message: 'Error al obtener campañas' });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const campaign = await Campaign.findByPk(id);
    if (!campaign) return res.status(404).json({ message: 'Campaña no encontrada' });
    res.json(campaign);
  } catch (error) {
    console.error('Error en getCampaignById:', error);
    res.status(500).json({ message: 'Error al obtener campaña' });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    let { name, description, color, groups, documentLink } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });
    if (groups && typeof groups === 'string') {
      try { groups = JSON.parse(groups); } catch (e) { groups = null; }
    }
    let imageUrl = null;
    if (req.files && req.files.image && req.files.image.length > 0) {
      imageUrl = `/uploads/campaigns/${req.files.image[0].filename}`;
    }
    let documentPath = null;
    if (req.files && req.files.document && req.files.document.length > 0) {
      documentPath = `/uploads/documents/${req.files.document[0].filename}`;
    }
    const campaign = await Campaign.create({
      name,
      description: description || '',
      color: color || '#E53E3E',
      imageUrl,
      groups: groups || [],
      documentLink: documentLink || null,
      document: documentPath,
    });

    // Notificar a todos los suscriptores activos
    try {
      const subscribers = await Subscriber.findAll({ where: { status: 'active' } });
      for (const sub of subscribers) {
        await sendCampaignNotification(sub.email, campaign).catch(err =>
          console.error(`Error email a ${sub.email}:`, err)
        );
      }
      console.log(`Notificaciones de campaña enviadas a ${subscribers.length} suscriptores`);
    } catch (emailError) {
      console.error('Error al enviar notificaciones de campaña:', emailError);
    }

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
    let { name, description, color, groups, documentLink } = req.body;
    if (groups && typeof groups === 'string') {
      try { groups = JSON.parse(groups); } catch (e) { groups = null; }
    }
    let imageUrl = campaign.imageUrl;
    if (req.files && req.files.image && req.files.image.length > 0) {
      if (campaign.imageUrl) deleteFileSafe(campaign.imageUrl, CAMPAIGNS_BASE);
      imageUrl = `/uploads/campaigns/${req.files.image[0].filename}`;
    }
    let documentPath = campaign.document;
    if (req.files && req.files.document && req.files.document.length > 0) {
      if (campaign.document) deleteFileSafe(campaign.document, DOCUMENTS_BASE);
      documentPath = `/uploads/documents/${req.files.document[0].filename}`;
    }
    await campaign.update({
      name: name || campaign.name,
      description: description !== undefined ? description : campaign.description,
      color: color || campaign.color,
      imageUrl,
      groups: groups || [],
      documentLink: documentLink !== undefined ? documentLink : campaign.documentLink,
      document: documentPath,
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
    if (campaign.imageUrl) deleteFileSafe(campaign.imageUrl, CAMPAIGNS_BASE);
    if (campaign.document) deleteFileSafe(campaign.document, DOCUMENTS_BASE);
    await campaign.destroy();
    res.json({ message: 'Campaña eliminada' });
  } catch (error) {
    console.error('Error en deleteCampaign:', error);
    res.status(500).json({ message: 'Error al eliminar campaña' });
  }
};