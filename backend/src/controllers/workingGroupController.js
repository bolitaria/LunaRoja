const WorkingGroup = require('../models/WorkingGroup');
const UserCampaign = require('../models/UserCampaign');

// Obtener todos los grupos (público o admin)
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
        return res.json([]); // No ven grupos
      }
    }

    const groups = await WorkingGroup.findAll({
      where,
      order: [['region', 'ASC'], ['name', 'ASC']]
    });
    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener grupos' });
  }
};

// Obtener un grupo por ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await WorkingGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener grupo' });
  }
};

// Crear un nuevo grupo (solo superadmin)
exports.createGroup = async (req, res) => {
  try {
    let { name, description, platform, link, region, campaignId } = req.body;
    if (!name || !link) {
      return res.status(400).json({ message: 'Nombre y enlace son requeridos' });
    }
    if (description === '') description = null;
    if (region === '') region = null;

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

// Actualizar un grupo (solo superadmin o campaign_admin propietario)
exports.updateGroup = async (req, res) => {
  try {
    const group = await WorkingGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (!group.campaignId || !allowedCampaignIds.includes(group.campaignId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar este grupo' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    let { name, description, platform, link, region, isActive, campaignId } = req.body;
    if (description === '') description = null;
    if (region === '') region = null;

    await group.update({ name, description, platform, link, region, isActive, campaignId });
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar grupo' });
  }
};

// Eliminar un grupo (solo superadmin)
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