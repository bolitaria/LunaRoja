const ChatGroup = require('../models/ChatGroup');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const { toInt, isValidId } = require('../utils/helpers');

exports.getAllGroups = async (req, res) => {
  try {
    let where = {};
    const { campaignId, actionId, publicOnly } = req.query;

    // Usuarios no autenticados → solo grupos públicos y activos
    if (!req.user) {
      where.isActive = true;
      where.isPublic = true;
    } else {
      // Usuarios autenticados: filtros según rol
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
      // superadmin ve todos sin restricciones
    }

    // Filtros opcionales por query (para usuarios autenticados o desde la UI pública)
    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);
    if (parsedCampaignId) where.campaignId = parsedCampaignId;
    if (parsedActionId) where.actionId = parsedActionId;

    // Si se pide explícitamente solo públicos (para panel admin)
    if (req.user && publicOnly === 'true') where.isPublic = true;

    const groups = await ChatGroup.findAll({
      where,
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] },
        { model: Action, as: 'action', attributes: ['id', 'title', 'bdsId', 'category'] } // ← 'category' añadido
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(groups);
  } catch (error) {
    console.error('Error en getAllGroups:', error);
    res.status(500).json({ message: 'Error al obtener grupos de chat' });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const group = await ChatGroup.findByPk(id, {
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] },
        { model: Action, as: 'action', attributes: ['id', 'title'] }
      ]
    });
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    res.json(group);
  } catch (error) {
    console.error('Error en getGroupById:', error);
    res.status(500).json({ message: 'Error al obtener grupo' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, description, platform, link, region, campaignId, actionId, isActive, isPublic } = req.body;
    if (!name || !platform || !link) return res.status(400).json({ message: 'Nombre, plataforma y enlace son requeridos' });

    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedIds = userCampaigns.map(uc => uc.campaignId);
      if (parsedCampaignId && !allowedIds.includes(parsedCampaignId)) {
        return res.status(403).json({ message: 'No tienes permiso para asociar este grupo a esa campaña' });
      }
    } else if (req.user.role === 'action_admin') {
      const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
      const allowedIds = userActions.map(ua => ua.actionId);
      if (parsedActionId && !allowedIds.includes(parsedActionId)) {
        return res.status(403).json({ message: 'No tienes permiso para asociar este grupo a esa acción' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para crear grupos' });
    }

    const group = await ChatGroup.create({
      name,
      description: description || null,
      platform,
      link,
      region: region || null,
      campaignId: parsedCampaignId,
      actionId: parsedActionId,
      isActive: isActive !== undefined ? isActive : true,
      isPublic: isPublic !== undefined ? isPublic : true
    });
    res.status(201).json(group);
  } catch (error) {
    console.error('Error en createGroup:', error);
    res.status(500).json({ message: 'Error al crear grupo' });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const group = await ChatGroup.findByPk(id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    const { name, description, platform, link, region, campaignId, actionId, isActive, isPublic } = req.body;
    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedIds = userCampaigns.map(uc => uc.campaignId);
      if (group.campaignId && !allowedIds.includes(group.campaignId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar este grupo' });
      }
    } else if (req.user.role === 'action_admin') {
      const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
      const allowedIds = userActions.map(ua => ua.actionId);
      if (group.actionId && !allowedIds.includes(group.actionId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar este grupo' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para editar grupos' });
    }

    await group.update({
      name: name !== undefined ? name : group.name,
      description: description !== undefined ? description : group.description,
      platform: platform || group.platform,
      link: link || group.link,
      region: region !== undefined ? region : group.region,
      campaignId: parsedCampaignId,
      actionId: parsedActionId,
      isActive: isActive !== undefined ? isActive : group.isActive,
      isPublic: isPublic !== undefined ? isPublic : group.isPublic
    });
    res.json(group);
  } catch (error) {
    console.error('Error en updateGroup:', error);
    res.status(500).json({ message: 'Error al actualizar grupo' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const group = await ChatGroup.findByPk(id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar grupos' });
    }
    await group.destroy();
    res.json({ message: 'Grupo eliminado' });
  } catch (error) {
    console.error('Error en deleteGroup:', error);
    res.status(500).json({ message: 'Error al eliminar grupo' });
  }
};