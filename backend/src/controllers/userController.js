const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const sequelize = require('../config/database');

// Obtener todos los usuarios (solo superadmin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Campaign, as: 'campaigns', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Action, as: 'actions', attributes: ['id', 'title'], through: { attributes: [] } }
      ]
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// Crear un nuevo usuario (solo superadmin)
exports.createUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { username, password, role, campaignIds, actionIds } = req.body;

    // Validaciones básicas
    if (!username || !password || !role) {
      await t.rollback();
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    if (!['superadmin', 'campaign_admin', 'action_admin'].includes(role)) {
      await t.rollback();
      return res.status(400).json({ message: 'Rol inválido' });
    }

    // Crear usuario
    const user = await User.create({ username, password, role }, { transaction: t });

    // Asignar campañas si es campaign_admin
    if (role === 'campaign_admin' && campaignIds && campaignIds.length > 0) {
      // Verificar que las campañas existan
      const campaigns = await Campaign.findAll({ where: { id: campaignIds }, transaction: t });
      if (campaigns.length !== campaignIds.length) {
        await t.rollback();
        return res.status(400).json({ message: 'Alguna campaña no existe', details: { campaignIds } });
      }
      const userCampaigns = campaignIds.map(campaignId => ({
        userId: user.id,
        campaignId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await UserCampaign.bulkCreate(userCampaigns, { transaction: t }).catch(err => {
        if (err.name === 'SequelizeUniqueConstraintError') {
          throw new Error('Ya existe una asignación duplicada para alguna campaña');
        }
        throw err;
      });
    }

    // Asignar acciones si es action_admin
    if (role === 'action_admin' && actionIds && actionIds.length > 0) {
      const actions = await Action.findAll({ where: { id: actionIds }, transaction: t });
      if (actions.length !== actionIds.length) {
        await t.rollback();
        return res.status(400).json({ message: 'Alguna acción no existe', details: { actionIds } });
      }
      const userActions = actionIds.map(actionId => ({
        userId: user.id,
        actionId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await UserAction.bulkCreate(userActions, { transaction: t }).catch(err => {
        if (err.name === 'SequelizeUniqueConstraintError') {
          throw new Error('Ya existe una asignación duplicada para alguna acción');
        }
        throw err;
      });
    }

    await t.commit();
    res.status(201).json({
      id: user.id,
      username: user.username,
      role: user.role,
      campaignIds: campaignIds || [],
      actionIds: actionIds || []
    });
  } catch (error) {
    await t.rollback();
    console.error('Error detallado:', error);
    if (error.message.includes('duplicada')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    }
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

// Actualizar un usuario (solo superadmin)
exports.updateUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = parseInt(req.params.id);
    const { username, password, role, campaignIds, actionIds } = req.body;

    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Proteger al superadmin principal (id=1)
    if (userId === 1 && role && role !== 'superadmin') {
      await t.rollback();
      return res.status(403).json({ message: 'No se puede cambiar el rol del superadmin principal' });
    }

    // Actualizar datos básicos
    if (username) user.username = username;
    if (password) user.password = password;
    if (role) user.role = role;
    await user.save({ transaction: t });

    // Actualizar campañas
    if (campaignIds !== undefined) {
      await UserCampaign.destroy({ where: { userId }, transaction: t });
      if (campaignIds.length > 0) {
        const userCampaigns = campaignIds.map(campaignId => ({
          userId,
          campaignId,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        await UserCampaign.bulkCreate(userCampaigns, { transaction: t });
      }
    }

    // Actualizar acciones
    if (actionIds !== undefined) {
      await UserAction.destroy({ where: { userId }, transaction: t });
      if (actionIds.length > 0) {
        const userActions = actionIds.map(actionId => ({
          userId,
          actionId,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        await UserAction.bulkCreate(userActions, { transaction: t });
      }
    }

    await t.commit();
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

// Eliminar un usuario (solo superadmin) - protege al usuario con id=1
exports.deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === 1) {
      return res.status(403).json({ message: 'No se puede eliminar el superadministrador principal' });
    }
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    await user.destroy();
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};