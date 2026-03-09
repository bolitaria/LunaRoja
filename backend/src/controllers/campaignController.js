const Campaign = require('../models/Campaign');
const UserCampaign = require('../models/UserCampaign');
const fs = require('fs');
const path = require('path');

exports.getAllCampaigns = async (req, res) => {
  try {
    console.log('========== getAllCampaigns ==========');
    console.log('req.user:', req.user);
    let where = {};

    if (req.user) {
      console.log('Usuario autenticado, role:', req.user.role);
      if (req.user.role === 'campaign_admin') {
        console.log('Es campaign_admin, buscando asignaciones para userId:', req.user.id);
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        console.log('userCampaigns encontradas:', userCampaigns.map(uc => uc.campaignId));
        const campaignIds = userCampaigns.map(uc => uc.campaignId);
        if (campaignIds.length === 0) {
          console.log('No tiene campañas asignadas, devolvemos []');
          return res.json([]);
        }
        where.id = campaignIds;
      } else if (req.user.role === 'action_admin') {
        console.log('action_admin - no devuelve campañas');
        return res.json([]);
      } else {
        console.log('superadmin - no filtra');
      }
    } else {
      console.log('Usuario no autenticado, devolvemos todas las campañas (público)');
    }

    console.log('where final:', where);
    const campaigns = await Campaign.findAll({ where, order: [['name', 'ASC']] });
    console.log('Campañas devueltas:', campaigns.map(c => ({ id: c.id, name: c.name })));
    console.log('======================================');
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
    const { name, description, color } = req.body;
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/campaigns/${req.file.filename}`;
    }
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });
    const campaign = await Campaign.create({ name, description, color, imageUrl });
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

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedIds = userCampaigns.map(uc => uc.campaignId);
      if (!allowedIds.includes(campaign.id)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta campaña' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { name, description, color } = req.body;
    let imageUrl = campaign.imageUrl;

    if (req.file) {
      if (campaign.imageUrl) {
        const oldPath = path.join(__dirname, '../../uploads/campaigns', path.basename(campaign.imageUrl));
        fs.unlink(oldPath, (err) => {
          if (err) console.error('Error al eliminar imagen anterior:', err);
        });
      }
      imageUrl = `/uploads/campaigns/${req.file.filename}`;
    }

    await campaign.update({ name, description, color, imageUrl });
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
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error al eliminar imagen:', err);
      });
    }

    await campaign.destroy();
    res.json({ message: 'Campaña eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar campaña' });
  }
};