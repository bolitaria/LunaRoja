const InstagramAccount = require('../models/InstagramAccount');
const InstagramPost = require('../models/InstagramPost');

// Obtener todas las cuentas
exports.getAllAccounts = async (req, res) => {
  try {
    let where = {};
    if (req.user && req.user.role === 'campaign_admin') {
      where.campaignId = req.user.campaignId;
    } else if (req.user && req.user.role === 'action_admin') {
      return res.json([]);
    }
    const accounts = await InstagramAccount.findAll({ where, order: [['username', 'ASC']] });
    res.json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener cuentas' });
  }
};

exports.getAccountById = async (req, res) => {
  try {
    const account = await InstagramAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ message: 'Cuenta no encontrada' });
    res.json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener cuenta' });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { username, campaignId } = req.body;
    if (!username) return res.status(400).json({ message: 'Username requerido' });

    const account = await InstagramAccount.create({
      username,
      campaignId: campaignId || null,
      isActive: true,
    });
    res.status(201).json(account);
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Esta cuenta ya está registrada' });
    }
    res.status(500).json({ message: 'Error al crear cuenta' });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const account = await InstagramAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ message: 'Cuenta no encontrada' });

    const { username, isActive, campaignId } = req.body;
    if (username) account.username = username;
    if (isActive !== undefined) account.isActive = isActive;
    if (campaignId !== undefined) account.campaignId = campaignId;

    await account.save();
    res.json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar cuenta' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const account = await InstagramAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ message: 'Cuenta no encontrada' });

    await account.destroy();
    res.json({ message: 'Cuenta eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar cuenta' });
  }
};

// Obtener publicaciones (público)
exports.getPosts = async (req, res) => {
  try {
    const { limit = 30, page = 1, accountId } = req.query;
    let where = {};
    if (accountId) where.accountId = accountId;

    // Si es campaign_admin, solo puede ver posts de cuentas de su campaña
    if (req.user && req.user.role === 'campaign_admin') {
      where['$account.campaignId$'] = req.user.campaignId;
    } else if (req.user && req.user.role === 'action_admin') {
      return res.json({ posts: [], total: 0, page: 1, totalPages: 0 });
    }

    const posts = await InstagramPost.findAndCountAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [{ model: InstagramAccount, as: 'account', attributes: ['username'] }],
    });

    res.json({
      posts: posts.rows,
      total: posts.count,
      page: parseInt(page),
      totalPages: Math.ceil(posts.count / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener publicaciones' });
  }
};