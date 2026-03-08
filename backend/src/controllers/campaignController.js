const Campaign = require('../models/Campaign');
const fs = require('fs');
const path = require('path');

exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({ order: [['name', 'ASC']] });
    res.json(campaigns);
  } catch (error) {
    console.error(error);
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