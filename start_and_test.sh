#!/bin/bash
set -e

echo "🐳 Levantando todos los contenedores..."
docker-compose up -d

echo "🔧 Corrigiendo chatGroupController.js..."
cat > backend/src/controllers/chatGroupController.js << 'EOF'
const ChatGroup = require('../models/ChatGroup');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const { toInt, isValidId } = require('../utils/helpers');

exports.getAllGroups = async (req, res) => {
  try {
    let where = {};
    const { campaignId, actionId } = req.query;
    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);

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

    if (!req.user) {
      if (parsedCampaignId) where.campaignId = parsedCampaignId;
      if (parsedActionId) where.actionId = parsedActionId;
    }

    const groups = await ChatGroup.findAll({
      where,
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] },
        { model: Action, as: 'assignedAction', attributes: ['id', 'title'] },
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
        { model: Action, as: 'assignedAction', attributes: ['id', 'title'] },
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
    const { name, description, platform, link, region, campaignId, actionId, isActive } = req.body;
    if (!name || !platform || !link) return res.status(400).json({ message: 'Nombre, plataforma y enlace son requeridos' });
    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedIds = userCampaigns.map(uc => uc.campaignId);
      if (parsedCampaignId && !allowedIds.includes(parsedCampaignId)) return res.status(403).json({ message: 'No tienes permiso para asociar este grupo a esa campaña' });
    } else if (req.user.role === 'action_admin') {
      const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
      const allowedIds = userActions.map(ua => ua.actionId);
      if (parsedActionId && !allowedIds.includes(parsedActionId)) return res.status(403).json({ message: 'No tienes permiso para asociar este grupo a esa acción' });
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para crear grupos' });
    }

    const group = await ChatGroup.create({
      name, description: description || null, platform, link,
      region: region || null, campaignId: parsedCampaignId, actionId: parsedActionId,
      isActive: isActive !== undefined ? isActive : true,
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

    const { name, description, platform, link, region, campaignId, actionId, isActive } = req.body;
    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedIds = userCampaigns.map(uc => uc.campaignId);
      if (group.campaignId && !allowedIds.includes(group.campaignId)) return res.status(403).json({ message: 'No tienes permiso para editar este grupo' });
    } else if (req.user.role === 'action_admin') {
      const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
      const allowedIds = userActions.map(ua => ua.actionId);
      if (group.actionId && !allowedIds.includes(group.actionId)) return res.status(403).json({ message: 'No tienes permiso para editar este grupo' });
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para editar grupos' });
    }

    await group.update({
      name: name || group.name,
      description: description !== undefined ? description : group.description,
      platform: platform || group.platform,
      link: link || group.link,
      region: region !== undefined ? region : group.region,
      campaignId: parsedCampaignId,
      actionId: parsedActionId,
      isActive: isActive !== undefined ? isActive : group.isActive,
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

    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'No tienes permiso para eliminar grupos' });
    await group.destroy();
    res.json({ message: 'Grupo eliminado' });
  } catch (error) {
    console.error('Error en deleteGroup:', error);
    res.status(500).json({ message: 'Error al eliminar grupo' });
  }
};
EOF

echo "🔄 Reconstruyendo backend (para incluir el controlador corregido)..."
docker-compose up -d --build backend

echo "⏳ Esperando a que el backend responda..."
for i in {1..30}; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api | grep -q "200"; then
    echo "✅ Backend listo"
    break
  fi
  sleep 2
done

echo "🚀 Ejecutando todas las pruebas..."
./full_test.sh