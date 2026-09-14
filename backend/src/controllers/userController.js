// backend/src/controllers/userController.js
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const UserBDS = require('../models/UserBDS');
const BDS = require('../models/BDS');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { toInt, isValidId } = require('../utils/helpers');
const { logAdminAction } = require('../services/auditService');

const safeAttributes = { exclude: ['password', 'refreshToken'] };

// ========================= GET ME =========================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: safeAttributes,
      include: [
        { model: Campaign, as: 'campaigns', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Action, as: 'assignedActions', attributes: ['id', 'title'], through: { attributes: [] } }
      ]
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

// ========================= GET ALL USERS =========================
exports.getAllUsers = async (req, res) => {
  try {
    const currentUser = req.user;
    let where = {};
    let include = [
      { model: Campaign, as: 'campaigns', attributes: ['id', 'name'], through: { attributes: [] } },
      { model: Action, as: 'assignedActions', attributes: ['id', 'title'], through: { attributes: [] } },
      { model: BDS, as: 'bdsCampaigns', attributes: ['id', 'name'], through: { attributes: [] } }
    ];

    if (currentUser.role === 'superadmin') {
      // Ve todos
    } else if (currentUser.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: currentUser.id } });
      const campaignIds = userCampaigns.map(uc => uc.campaignId);
      if (campaignIds.length === 0) return res.json([]);

      const actions = await Action.findAll({ where: { campaignId: campaignIds } });
      const actionIds = actions.map(a => a.id);
      const userActionRecords = await UserAction.findAll({ where: { actionId: actionIds } });
      const actionAdminIds = userActionRecords.map(ua => ua.userId);

      where = {
        role: 'action_admin',
        id: { [Op.in]: actionAdminIds }
      };
    } else {
      return res.status(403).json({ message: 'No tienes permiso para ver la lista de usuarios' });
    }

    const users = await User.findAll({
      where,
      attributes: safeAttributes,
      include
    });
    res.json(users);
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};


// ========================= GET USER BY ID =========================
exports.getUserById = async (req, res) => {
  try {
    const currentUser = req.user;
    const userId = parseInt(req.params.id);
    if (!isValidId(userId)) return res.status(400).json({ message: 'ID inválido' });

    const user = await User.findByPk(userId, {
      attributes: safeAttributes,
      include: [
        { model: Campaign, as: 'campaigns', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Action, as: 'assignedActions', attributes: ['id', 'title'], through: { attributes: [] } },
        { model: BDS, as: 'bdsCampaigns', attributes: ['id', 'name'], through: { attributes: [] } },
      ],
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Restricciones: campaign_admin solo puede ver action_admins de sus campañas
    if (currentUser.role === 'campaign_admin') {
      if (user.role !== 'action_admin') {
        return res.status(403).json({ message: 'No tienes permiso para ver este usuario' });
      }
    } else if (currentUser.role !== 'superadmin') {
      // Otros roles solo pueden verse a sí mismos
      if (userId !== currentUser.id) {
        return res.status(403).json({ message: 'No tienes permiso para ver este usuario' });
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Error en getUserById:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

// ========================= CREATE USER =========================
exports.createUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const currentUser = req.user;
    const { username, password, email, role, campaignIds, actionIds, bdsIds } = req.body;

    if (!username || !password || !role) {
      await t.rollback();
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    if (!['superadmin', 'campaign_admin', 'action_admin', 'bds_admin', 'blog_admin'].includes(role)) {
      await t.rollback();
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const parsedCampaignIds = Array.isArray(campaignIds) ? campaignIds.map(id => toInt(id)).filter(id => id !== null) : [];
    const parsedActionIds = Array.isArray(actionIds) ? actionIds.map(id => toInt(id)).filter(id => id !== null) : [];
    const parsedBdsIds = Array.isArray(bdsIds) ? bdsIds.map(id => toInt(id)).filter(id => id !== null) : [];

    if (currentUser.role === 'superadmin') {
      // Permitido todo
    } else if (currentUser.role === 'campaign_admin') {
      if (role !== 'action_admin') {
        await t.rollback();
        return res.status(403).json({ message: 'Solo puedes crear administradores de acción' });
      }
      if (parsedActionIds.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: 'Debes asignar al menos una acción' });
      }
      const userCampaigns = await UserCampaign.findAll({ where: { userId: currentUser.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      const actions = await Action.findAll({ where: { id: parsedActionIds } });
      for (let action of actions) {
        if (!allowedCampaignIds.includes(action.campaignId)) {
          await t.rollback();
          return res.status(403).json({ message: `La acción ${action.title} no pertenece a tus campañas` });
        }
      }
    } else {
      await t.rollback();
      return res.status(403).json({ message: 'No tienes permiso para crear usuarios' });
    }

    const userData = { username, password, role };
    if (email !== undefined) userData.email = email;

    const user = await User.create(userData, { transaction: t });

    if (role === 'campaign_admin' && parsedCampaignIds.length > 0) {
      const campaigns = await Campaign.findAll({ where: { id: parsedCampaignIds }, transaction: t });
      if (campaigns.length !== parsedCampaignIds.length) {
        await t.rollback();
        return res.status(400).json({ message: 'Alguna campaña no existe' });
      }
      const userCampaignsData = parsedCampaignIds.map(campaignId => ({
        userId: user.id, campaignId, createdAt: new Date(), updatedAt: new Date()
      }));
      await UserCampaign.bulkCreate(userCampaignsData, { transaction: t });
    }

    if (role === 'action_admin' && parsedActionIds.length > 0) {
      const actions = await Action.findAll({ where: { id: parsedActionIds }, transaction: t });
      if (actions.length !== parsedActionIds.length) {
        await t.rollback();
        return res.status(400).json({ message: 'Alguna acción no existe' });
      }
      const userActionsData = parsedActionIds.map(actionId => ({
        userId: user.id, actionId, createdAt: new Date(), updatedAt: new Date()
      }));
      await UserAction.bulkCreate(userActionsData, { transaction: t });
    }

    if (role === 'bds_admin' && parsedBdsIds.length > 0) {
      const bdsList = await BDS.findAll({ where: { id: parsedBdsIds }, transaction: t });
      if (bdsList.length !== parsedBdsIds.length) {
        await t.rollback();
        return res.status(400).json({ message: 'Alguna campaña BDS no existe' });
      }
      const userBdsData = parsedBdsIds.map(bdsId => ({
        userId: user.id, bdsId, createdAt: new Date(), updatedAt: new Date()
      }));
      await UserBDS.bulkCreate(userBdsData, { transaction: t });
    }

    await t.commit();

    const createdUser = await User.findByPk(user.id, {
      attributes: safeAttributes,
      include: [
        { model: Campaign, as: 'campaigns', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Action, as: 'assignedActions', attributes: ['id', 'title'], through: { attributes: [] } }
      ]
    });

    await logAdminAction(req, {
      action: 'create-user',
      entityType: 'user',
      entityId: user.id,
      metadata: { username: user.username, role: user.role },
    });

    res.status(201).json(createdUser);
  } catch (error) {
    await t.rollback();
    console.error('Error en createUser:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    }
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

// ========================= UPDATE USER =========================
exports.updateUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const currentUser = req.user;
    const userId = parseInt(req.params.id);
    if (!isValidId(userId)) {
      await t.rollback();
      return res.status(400).json({ message: 'ID inválido' });
    }
    const { username, password, email, role, campaignIds, actionIds, bdsIds } = req.body;
    const userToUpdate = await User.findByPk(userId, { transaction: t });
    if (!userToUpdate) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const parsedCampaignIds = Array.isArray(campaignIds) ? campaignIds.map(id => toInt(id)).filter(id => id !== null) : undefined;
    const parsedActionIds = Array.isArray(actionIds) ? actionIds.map(id => toInt(id)).filter(id => id !== null) : undefined;
    const parsedBdsIds = Array.isArray(bdsIds) ? bdsIds.map(id => toInt(id)).filter(id => id !== null) : undefined;

    if (currentUser.role === 'superadmin') {
      if (userId === 1 && role && role !== 'superadmin') {
        await t.rollback();
        return res.status(403).json({ message: 'No se puede cambiar el rol del superadmin principal' });
      }
    } else if (currentUser.role === 'campaign_admin') {
      if (userToUpdate.role !== 'action_admin') {
        await t.rollback();
        return res.status(403).json({ message: 'Solo puedes editar administradores de acción' });
      }
      const userActions = await UserAction.findAll({ where: { userId } });
      const actionIdsOfUser = userActions.map(ua => ua.actionId);
      const actions = await Action.findAll({ where: { id: actionIdsOfUser } });
      const userCampaigns = await UserCampaign.findAll({ where: { userId: currentUser.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      for (let action of actions) {
        if (!allowedCampaignIds.includes(action.campaignId)) {
          await t.rollback();
          return res.status(403).json({ message: 'No tienes permiso para editar este usuario' });
        }
      }
      if (parsedActionIds !== undefined) {
        const newActions = await Action.findAll({ where: { id: parsedActionIds } });
        for (let action of newActions) {
          if (!allowedCampaignIds.includes(action.campaignId)) {
            await t.rollback();
            return res.status(403).json({ message: `La acción ${action.title} no pertenece a tus campañas` });
          }
        }
      }
      if (role && role !== 'action_admin') {
        await t.rollback();
        return res.status(403).json({ message: 'No puedes cambiar el rol de un administrador de acción' });
      }
    } else {
      await t.rollback();
      return res.status(403).json({ message: 'No tienes permiso para editar usuarios' });
    }

    if (username) userToUpdate.username = username;
    if (password) userToUpdate.password = password;
    if (email !== undefined) userToUpdate.email = email;
    if (role) userToUpdate.role = role;
    await userToUpdate.save({ transaction: t });

    if (parsedCampaignIds !== undefined) {
      await UserCampaign.destroy({ where: { userId }, transaction: t });
      if (parsedCampaignIds.length > 0) {
        const userCampaignsData = parsedCampaignIds.map(campaignId => ({
          userId, campaignId, createdAt: new Date(), updatedAt: new Date()
        }));
        await UserCampaign.bulkCreate(userCampaignsData, { transaction: t });
      }
    }

    if (parsedActionIds !== undefined) {
      await UserAction.destroy({ where: { userId }, transaction: t });
      if (parsedActionIds.length > 0) {
        const userActionsData = parsedActionIds.map(actionId => ({
          userId, actionId, createdAt: new Date(), updatedAt: new Date()
        }));
        await UserAction.bulkCreate(userActionsData, { transaction: t });
      }
    }

    if (parsedBdsIds !== undefined) {
      await UserBDS.destroy({ where: { userId }, transaction: t });
      if (parsedBdsIds.length > 0) {
        const userBdsData = parsedBdsIds.map(bdsId => ({
          userId, bdsId, createdAt: new Date(), updatedAt: new Date()
        }));
        await UserBDS.bulkCreate(userBdsData, { transaction: t });
      }
    }

    await t.commit();

    const updatedUser = await User.findByPk(userId, {
      attributes: safeAttributes,
      include: [
        { model: Campaign, as: 'campaigns', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Action, as: 'assignedActions', attributes: ['id', 'title'], through: { attributes: [] } }
      ]
    });

    await logAdminAction(req, {
      action: 'update-user',
      entityType: 'user',
      entityId: userId,
      metadata: { changed: Object.keys(req.body) },
    });

    res.json(updatedUser);
  } catch (error) {
    await t.rollback();
    console.error('Error en updateUser:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

// ========================= DELETE USER =========================
exports.deleteUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const userId = parseInt(req.params.id);
    if (!isValidId(userId)) return res.status(400).json({ message: 'ID inválido' });
    if (userId === 1) return res.status(403).json({ message: 'No se puede eliminar el superadministrador principal' });

    const userToDelete = await User.findByPk(userId);
    if (!userToDelete) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (currentUser.role === 'superadmin') {
      // permitido
    } else if (currentUser.role === 'campaign_admin') {
      if (userToDelete.role !== 'action_admin') {
        return res.status(403).json({ message: 'Solo puedes eliminar administradores de acción' });
      }
      const userActions = await UserAction.findAll({ where: { userId } });
      const actionIds = userActions.map(ua => ua.actionId);
      const actions = await Action.findAll({ where: { id: actionIds } });
      const userCampaigns = await UserCampaign.findAll({ where: { userId: currentUser.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      for (let action of actions) {
        if (!allowedCampaignIds.includes(action.campaignId)) {
          return res.status(403).json({ message: 'No tienes permiso para eliminar este usuario' });
        }
      }
    } else {
      return res.status(403).json({ message: 'No tienes permiso para eliminar usuarios' });
    }

    const snapshot = { username: userToDelete.username, role: userToDelete.role };

    await userToDelete.destroy();

    await logAdminAction(req, {
      action: 'delete-user',
      entityType: 'user',
      entityId: userId,
      metadata: snapshot,
    });

    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

// ========================= CHANGE MY PASSWORD =========================
exports.changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Debes proporcionar la contraseña actual y la nueva' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'La contraseña actual no es correcta' });
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'La nueva contraseña debe ser diferente a la actual' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en changeMyPassword:', error);
    res.status(500).json({ message: 'Error al cambiar la contraseña' });
  }
};