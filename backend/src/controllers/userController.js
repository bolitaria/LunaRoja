const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const sequelize = require('../config/database'); // Importación directa (sin llaves)
const { Op } = require('sequelize');

// Obtener todos los usuarios (filtrados según rol del usuario autenticado)
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
      // Obtener las campañas del usuario
      const userCampaigns = await UserCampaign.findAll({ where: { userId: currentUser.id } });
      const campaignIds = userCampaigns.map(uc => uc.campaignId);
      if (campaignIds.length === 0) return res.json([]);

      // Buscar acciones de esas campañas
      const actions = await Action.findAll({ where: { campaignId: campaignIds } });
      const actionIds = actions.map(a => a.id);
      if (actionIds.length === 0) return res.json([]);

      // Obtener usuarios action_admin que tengan esas acciones
      const userActionRecords = await UserAction.findAll({ where: { actionId: actionIds } });
      const userIds = userActionRecords.map(ua => ua.userId);
      if (userIds.length === 0) return res.json([]);

      where = {
        role: 'action_admin',
        id: { [Op.in]: userIds }
      };
    } else if (currentUser.role === 'action_admin') {
      // Action admin no puede ver usuarios
      return res.json([]);
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// Crear un nuevo usuario
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

    // Superadmin puede crear cualquier rol
    if (currentUser.role === 'superadmin') {
      // Todo permitido
    } else if (currentUser.role === 'campaign_admin') {
      // Solo puede crear action_admin, y las acciones deben pertenecer a sus campañas
      if (role !== 'action_admin') {
        await t.rollback();
        return res.status(403).json({ message: 'Solo puedes crear administradores de evento' });
      }
      if (!actionIds || actionIds.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: 'Debes asignar al menos una acción' });
      }
      // Obtener las campañas del campaign_admin
      const userCampaigns = await UserCampaign.findAll({ where: { userId: currentUser.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      // Verificar que todas las acciones pertenezcan a esas campañas
      const actions = await Action.findAll({ where: { id: actionIds } });
      for (let action of actions) {
        if (!allowedCampaignIds.includes(action.campaignId)) {
          await t.rollback();
          return res.status(403).json({ message: `La acción ${action.title} no pertenece a tus campañas` });
        }
      }
    } else {
      // action_admin no puede crear
      await t.rollback();
      return res.status(403).json({ message: 'No tienes permiso para crear usuarios' });
    }

    // Crear usuario
    const user = await User.create({ username, password, role }, { transaction: t });

    // Asignar campañas si es campaign_admin
    if (role === 'campaign_admin' && campaignIds && campaignIds.length > 0) {
      const campaigns = await Campaign.findAll({ where: { id: campaignIds }, transaction: t });
      if (campaigns.length !== campaignIds.length) {
        await t.rollback();
        return res.status(400).json({ message: 'Alguna campaña no existe' });
      }
      const userCampaignsData = campaignIds.map(campaignId => ({
        userId: user.id,
        campaignId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await UserCampaign.bulkCreate(userCampaignsData, { transaction: t });
    }

    // Asignar acciones si es action_admin
    if (role === 'action_admin' && actionIds && actionIds.length > 0) {
      const actions = await Action.findAll({ where: { id: actionIds }, transaction: t });
      if (actions.length !== actionIds.length) {
        await t.rollback();
        return res.status(400).json({ message: 'Alguna acción no existe' });
      }
      const userActionsData = actionIds.map(actionId => ({
        userId: user.id,
        actionId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await UserAction.bulkCreate(userActionsData, { transaction: t });
    }

    await t.commit();

    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Campaign, as: 'campaigns', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Action, as: 'actions', attributes: ['id', 'title'], through: { attributes: [] } }
      ]
    });
    res.status(201).json(createdUser);
  } catch (error) {
    await t.rollback();
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    }
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

// Actualizar un usuario
exports.updateUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const currentUser = req.user;
    const userId = parseInt(req.params.id);
    const { username, password, role, campaignIds, actionIds } = req.body;

    const userToUpdate = await User.findByPk(userId, { transaction: t });
    if (!userToUpdate) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar permisos según el rol del usuario que hace la petición
    if (currentUser.role === 'superadmin') {
      // Superadmin puede actualizar cualquier usuario (excepto cambiar rol de id=1)
      if (userId === 1 && role && role !== 'superadmin') {
        await t.rollback();
        return res.status(403).json({ message: 'No se puede cambiar el rol del superadmin principal' });
      }
    } else if (currentUser.role === 'campaign_admin') {
      // Un campaign_admin solo puede actualizar action_admin que estén bajo sus campañas
      if (userToUpdate.role !== 'action_admin') {
        await t.rollback();
        return res.status(403).json({ message: 'Solo puedes editar administradores de evento' });
      }
      // Verificar que el usuario a actualizar tenga acciones que pertenezcan a las campañas del currentUser
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
      // Si se cambian las acciones, verificar que las nuevas también estén en sus campañas
      if (actionIds !== undefined) {
        const newActions = await Action.findAll({ where: { id: actionIds } });
        for (let action of newActions) {
          if (!allowedCampaignIds.includes(action.campaignId)) {
            await t.rollback();
            return res.status(403).json({ message: `La acción ${action.title} no pertenece a tus campañas` });
          }
        }
      }
      // No puede cambiar el rol a otro
      if (role && role !== 'action_admin') {
        await t.rollback();
        return res.status(403).json({ message: 'No puedes cambiar el rol de un administrador de evento' });
      }
    } else {
      // action_admin no puede editar otros
      await t.rollback();
      return res.status(403).json({ message: 'No tienes permiso para editar usuarios' });
    }

    // Actualizar datos básicos
    if (username) userToUpdate.username = username;
    if (password) userToUpdate.password = password;
    if (role) userToUpdate.role = role;
    await userToUpdate.save({ transaction: t });

    // Actualizar campañas (solo si es superadmin y el rol es campaign_admin)
    if (campaignIds !== undefined) {
      await UserCampaign.destroy({ where: { userId }, transaction: t });
      if (campaignIds.length > 0) {
        const userCampaignsData = campaignIds.map(campaignId => ({
          userId,
          campaignId,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        await UserCampaign.bulkCreate(userCampaignsData, { transaction: t });
      }
    }

    // Actualizar acciones
    if (actionIds !== undefined) {
      await UserAction.destroy({ where: { userId }, transaction: t });
      if (actionIds.length > 0) {
        const userActionsData = actionIds.map(actionId => ({
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
      attributes: { exclude: ['password'] },
      include: [
        { model: Campaign, as: 'campaigns', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Action, as: 'actions', attributes: ['id', 'title'], through: { attributes: [] } }
      ]
    });
    res.json(updatedUser);
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

// Eliminar un usuario
exports.deleteUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const userId = parseInt(req.params.id);

    if (userId === 1) {
      return res.status(403).json({ message: 'No se puede eliminar el superadministrador principal' });
    }

    const userToDelete = await User.findByPk(userId);
    if (!userToDelete) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Verificar permisos
    if (currentUser.role === 'superadmin') {
      // superadmin puede eliminar cualquier usuario excepto id=1
    } else if (currentUser.role === 'campaign_admin') {
      // solo puede eliminar action_admin que estén bajo sus campañas
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
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

// Cambiar la contraseña del usuario autenticado
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
    console.error(error);
    res.status(500).json({ message: 'Error al cambiar la contraseña' });
  }
};