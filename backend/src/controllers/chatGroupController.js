// backend/src/controllers/chatGroupController.js
const ChatGroup = require('../models/ChatGroup');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');

exports.getAllGroups = async (req, res) => {
  try {
    let where = {};
    const { campaignId, actionId } = req.query;   // permitir filtros desde el frontend

    if (req.user && req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const campaignIds = userCampaigns.map(uc => uc.campaignId);
      if (campaignIds.length === 0) return res.json([]);
      where.campaignId = campaignIds;
    } else if (req.user && req.user.role === 'action_admin') {
      const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
      const actionIds = userActions.map(ua => ua.actionId);
      if (actionIds.length === 0) return res.json([]);
      where.actionId = actionIds;
    }

    // filtros públicos (si no está autenticado, se aplican directamente)
    if (!req.user) {
      if (campaignId) where.campaignId = campaignId;
      if (actionId) where.actionId = actionId;
    }

    const groups = await ChatGroup.findAll({
      where,
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] },
        { model: Action, as: 'action', attributes: ['id', 'title'] },
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener grupos de chat' });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await ChatGroup.findByPk(req.params.id, {
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] },
        { model: Action, as: 'action', attributes: ['id', 'title'] },
      ]
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
    const { name, description, platform, link, region, campaignId, actionId, isActive } = req.body;
    if (!name || !platform || !link) {
      return res.status(400).json({ message: 'Nombre, plataforma y enlace son requeridos' });
    }

    // validación de permisos similar a la anterior, añadiendo actionId
    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (campaignId && !allowedCampaignIds.includes(parseInt(campaignId))) {
        return res.status(403).json({ message: 'No tienes permiso para asociar este grupo a esa campaña' });
      }
    } else if (req.user.role === 'action_admin') {
      const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
      const allowedActionIds = userActions.map(ua => ua.actionId);
      if (actionId && !allowedActionIds.includes(parseInt(actionId))) {
        return res.status(403).json({ message: 'No tienes permiso para asociar este grupo a esa acción' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para crear grupos' });
    }

    const group = await ChatGroup.create({
      name,
      description,
      platform,
      link,
      region: region || null,
      campaignId: campaignId || null,
      actionId: actionId || null,
      isActive: isActive !== undefined ? isActive : true,
    });
    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear grupo' });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await ChatGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    const { name, description, platform, link, region, campaignId, actionId, isActive } = req.body;

    // validación de permisos (similar, comprobando tanto campaña como acción)
    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (group.campaignId && !allowedCampaignIds.includes(group.campaignId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar este grupo' });
      }
    } else if (req.user.role === 'action_admin') {
      const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
      const allowedActionIds = userActions.map(ua => ua.actionId);
      if (group.actionId && !allowedActionIds.includes(group.actionId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar este grupo' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para editar grupos' });
    }

    await group.update({
      name,
      description,
      platform,
      link,
      region: region || null,
      campaignId: campaignId || null,
      actionId: actionId || null,
      isActive,
    });
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar grupo' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await ChatGroup.findByPk(req.params.id);
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