const WorkingGroup = require('../models/WorkingGroup');
const Campaign = require('../models/Campaign');
const UserCampaign = require('../models/UserCampaign');

exports.getAllGroups = async (req, res) => {
  try {
    let where = { isActive: true };

    if (req.user) {
      if (req.user.role === 'campaign_admin') {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const campaignIds = userCampaigns.map(uc => uc.campaignId);
        if (campaignIds.length === 0) return res.json([]);
        where.campaignId = campaignIds;
      } else if (req.user.role === 'action_admin') {
        return res.json([]);
      }
    }

    const groups = await WorkingGroup.findAll({
      where,
      include: [{ model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] }],
      order: [['region', 'ASC'], ['name', 'ASC']]
    });

    const formattedGroups = groups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      platform: g.platform,
      link: g.link,
      region: g.region,
      isActive: g.isActive,
      campaignId: g.campaignId,
      campaign: g.campaign ? {
        id: g.campaign.id,
        name: g.campaign.name,
        color: g.campaign.color
      } : null,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt
    }));

    res.json(formattedGroups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener grupos' });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await WorkingGroup.findByPk(req.params.id, {
      include: [{ model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] }]
    });
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener grupo' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    let { name, description, platform, link, region, campaignId } = req.body;
    if (!name || !link) {
      return res.status(400).json({ message: 'Nombre y enlace son requeridos' });
    }
    if (description === '') description = null;
    if (region === '') region = null;

    // Verificar permisos si es campaign_admin
    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (campaignId && !allowedCampaignIds.includes(parseInt(campaignId))) {
        return res.status(403).json({ message: 'No tienes permiso para asociar este grupo a esa campaña' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para crear grupos' });
    }

    const group = await WorkingGroup.create({
      name,
      description,
      platform: platform || 'telegram',
      link,
      region,
      campaignId: campaignId || null,
      isActive: true
    });
    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear grupo' });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await WorkingGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    let { name, description, platform, link, region, isActive, campaignId } = req.body;

    // Verificar permisos
    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (group.campaignId && !allowedCampaignIds.includes(group.campaignId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar este grupo' });
      }
      // No puede cambiar la campaña si no es superadmin
      campaignId = group.campaignId;
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    if (description === '') description = null;
    if (region === '') region = null;

    await group.update({ name, description, platform, link, region, isActive, campaignId });
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar grupo' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await WorkingGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar grupos' });
    }

    await group.destroy();
    res.json({ message: 'Grupo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar grupo' });
  }
};