const Campaign = require('../models/Campaign');

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
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });
    const campaign = await Campaign.create({ name, description, color });
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
    await campaign.update({ name, description, color });
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

    // Opcional: desvincular acciones antes de eliminar
    await campaign.destroy();
    res.json({ message: 'Campaña eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar campaña' });
  }
};