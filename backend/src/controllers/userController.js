const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { toInt, isValidId } = require('../utils/helpers');

// Atributos que NUNCA deben enviarse al cliente
const safeAttributes = { exclude: ['password', 'refreshToken'] };

// ========================= GET ME (para el perfil) =========================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: safeAttributes,
      include: [
        { model: Campaign, as: 'campaigns', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Action, as: 'actions', attributes: ['id', 'title'], through: { attributes: [] } }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
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
      { model: Action, as: 'actions', attributes: ['id', 'title'], through: { attributes: [] } }
    ];

    if (currentUser.role === 'superadmin') {
      // Superadmin ve todos
    } else if (currentUser.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: currentUser.id } });
      const campaignIds = userCampaigns.map(uc => uc.campaignId);
      if (campaignIds.length === 0) return res.json([]);

      const actions = await Action.findAll({ where: { campaignId: campaignIds } });
      const actionIds = actions.map(a => a.id);
      if (actionIds.length === 0) return res.json([]);

      const userActionRecords = await UserAction.findAll({ where: { actionId: actionIds } });
      const userIds = userActionRecords.map(ua => ua.userId);
      if (userIds.length === 0) return res.json([]);

      where = {
        role: 'action_admin',
        id: { [Op.in]: userIds }
      };
    } else if (currentUser.role === 'action_admin') {
      return res.json([]);
    }

    const users = await User.findAll({
      where,
      attributes: safeAttributes,   // ← ahora excluye password Y refreshToken
      include
    });
    res.json(users);
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// ========================= CREATE USER =========================
exports.createUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const currentUser = req.user;
    const { username, password, role, campaignIds, actionIds } = req.body;

    if (!username || !password || !role) {
      await t.rollback();
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    if (!['superadmin', 'campaign_admin', 'action_admin'].includes(role)) {
      await t.rollback();
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const parsedCampaignIds = Array.isArray(campaignIds) ? campaignIds.map(id => toInt(id)).filter(id => id !== null) : [];
    const parsedActionIds = Array.isArray(actionIds) ? actionIds.map(id => toInt(id)).filter(id => id !== null) : [];

    if (currentUser.role === 'superadmin') {
      // Permitido todo
    } else if (currentUser.role === 'campaign_admin') {
      if (role !== 'action_admin') {
        await t.rollback();
        return res.status(403).json({ message: 'Solo puedes crear administradores de evento' });
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

    const user = await User.create({ username, password, role }, { transaction: t });

    if (role === 'campaign_admin' && parsedCampaignIds.length > 0) {
      const campaigns = await Campaign.findAll({ where: { id: parsedCampaignIds }, transaction: t });
      if (campaigns.length !== parsedCampaignIds.length) {
        await t.rollback();
        return res.status(400).json({ message: 'Alguna campaña no existe' });
      }
      const userCampaignsData = parsedCampaignIds.map(campaignId => ({
        userId: user.id,
        campaignId,
        createdAt: new Date(),
        updatedAt: new Date()
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
        userId: user.id,
        actionId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await UserAction.bulkCreate(userActionsData, { transaction: t });
    }

    await t.commit();

    const createdUser = await User.findByPk(user.id, {
      attributes: safeAttributes,  // ← excluye password y refreshToken
      include: [
        { model: Campaign, as: 'campaigns', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Action, as: 'actions', attributes: ['id', 'title'], through: { attributes: [] } }
      ]
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
    const { username, password, role, campaignIds, actionIds } = req.body;

    const userToUpdate = await User.findByPk(userId, { transaction: t });
    if (!userToUpdate) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const parsedCampaignIds = Array.isArray(campaignIds) ? campaignIds.map(id => toInt(id)).filter(id => id !== null) : undefined;
    const parsedActionIds = Array.isArray(actionIds) ? actionIds.map(id => toInt(id)).filter(id => id !== null) : undefined;

    if (currentUser.role === 'superadmin') {
      if (userId === 1 && role && role !== 'superadmin') {
        await t.rollback();
        return res.status(403).json({ message: 'No se puede cambiar el rol del superadmin principal' });
      }
    } else if (currentUser.role === 'campaign_admin') {
      if (userToUpdate.role !== 'action_admin') {
        await t.rollback();
        return res.status(403).json({ message: 'Solo puedes editar administradores de evento' });
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
        return res.status(403).json({ message: 'No puedes cambiar el rol de un administrador de evento' });
      }
    } else {
      await t.rollback();
      return res.status(403).json({ message: 'No tienes permiso para editar usuarios' });
    }

    if (username) userToUpdate.username = username;
    if (password) userToUpdate.password = password;
    if (role) userToUpdate.role = role;
    await userToUpdate.save({ transaction: t });

    if (parsedCampaignIds !== undefined) {
      await UserCampaign.destroy({ where: { userId }, transaction: t });
      if (parsedCampaignIds.length > 0) {
        const userCampaignsData = parsedCampaignIds.map(campaignId => ({
          userId,
          campaignId,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        await UserCampaign.bulkCreate(userCampaignsData, { transaction: t });
      }
    }

    if (parsedActionIds !== undefined) {
      await UserAction.destroy({ where: { userId }, transaction: t });
      if (parsedActionIds.length > 0) {
        const userActionsData = parsedActionIds.map(actionId => ({
          userId,
          actionId,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        await UserAction.bulkCreate(userActionsData, { transaction: t });
      }
    }

    await t.commit();

    const updatedUser = await User.findByPk(userId, {
      attributes: safeAttributes,  // ← excluye password y refreshToken
      include: [
        { model: Campaign, as: 'campaigns', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Action, as: 'actions', attributes: ['id', 'title'], through: { attributes: [] } }
      ]
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
    if (!isValidId(userId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    if (userId === 1) {
      return res.status(403).json({ message: 'No se puede eliminar el superadministrador principal' });
    }

    const userToDelete = await User.findByPk(userId);
    if (!userToDelete) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (currentUser.role === 'superadmin') {
      // permitido
    } else if (currentUser.role === 'campaign_admin') {
      if (userToDelete.role !== 'action_admin') {
        return res.status(403).json({ message: 'Solo puedes eliminar administradores de evento' });
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

    await userToDelete.destroy();
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
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual no es correcta' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en changeMyPassword:', error);
    res.status(500).json({ message: 'Error al cambiar la contraseña' });
  }
};