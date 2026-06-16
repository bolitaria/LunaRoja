const Campaign = require('../models/Campaign');
const UserCampaign = require('../models/UserCampaign');
const Subscriber = require('../models/Subscriber');
const { sendCampaignNotification } = require('../services/emailService');
const fs = require('fs');
const path = require('path');

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
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaña no encontrada' });
    res.json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener campaña' });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    let { name, description, color, groups, documentLink } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });

    // Parse groups if string
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
      description,
      color,
      imageUrl,
      groups,
      documentLink: documentLink || null,
      document: documentPath
    });

    // Notificar a suscriptores
    try {
      const subscribers = await Subscriber.findAll({ where: { status: 'active' } });
      for (const sub of subscribers) {
        await sendCampaignNotification(sub.email, campaign).catch(err => console.error(`Error email a ${sub.email}:`, err));
      }
      console.log(`Notificaciones de campaña enviadas a ${subscribers.length} suscriptores`);
    } catch (emailError) {
      console.error('Error al enviar notificaciones de campaña:', emailError);
    }

    res.status(201).json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear campaña' });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaña no encontrada' });

    // Permisos
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

    // Imagen
    let imageUrl = campaign.imageUrl;
    if (req.files && req.files.image && req.files.image.length > 0) {
      if (campaign.imageUrl) {
        const oldPath = path.join(__dirname, '../../uploads/campaigns', path.basename(campaign.imageUrl));
        fs.unlink(oldPath, (err) => { if (err) console.error('Error al eliminar imagen anterior:', err); });
      }
      imageUrl = `/uploads/campaigns/${req.files.image[0].filename}`;
    }

    // Documento
    let documentPath = campaign.document;
    if (req.files && req.files.document && req.files.document.length > 0) {
      if (campaign.document) {
        const oldDocPath = path.join(__dirname, '../../uploads/documents', path.basename(campaign.document));
        fs.unlink(oldDocPath, (err) => { if (err) console.error('Error al eliminar documento anterior:', err); });
      }
      documentPath = `/uploads/documents/${req.files.document[0].filename}`;
    }

    await campaign.update({
      name,
      description,
      color,
      imageUrl,
      groups,
      documentLink: documentLink || null,
      document: documentPath
    });

    res.json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar campaña' });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaña no encontrada' });

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar campañas' });
    }

    if (campaign.imageUrl) {
      const filePath = path.join(__dirname, '../../uploads/campaigns', path.basename(campaign.imageUrl));
      fs.unlink(filePath, (err) => { if (err) console.error('Error al eliminar imagen:', err); });
    }
    if (campaign.document) {
      const docPath = path.join(__dirname, '../../uploads/documents', path.basename(campaign.document));
      fs.unlink(docPath, (err) => { if (err) console.error('Error al eliminar documento:', err); });
    }

    await campaign.destroy();
    res.json({ message: 'Campaña eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar campaña' });
  }
};