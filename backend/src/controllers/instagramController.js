const InstagramAccount = require('../models/InstagramAccount');
const InstagramPost = require('../models/InstagramPost');

// No importar el scraper al inicio para evitar dependencias circulares
let scrapeAccount;
try {
    const scraper = require('../scraping/instagramScraper');
    scrapeAccount = scraper.scrapeAccount;
} catch (err) {
    console.log('⚠️ Scraper de Instagram no disponible, función manualScrape desactivada');
}

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
        const { username, tag, campaignId } = req.body;
        if (!username) return res.status(400).json({ message: 'Username requerido' });

        const account = await InstagramAccount.create({
            username,
            tag: tag || null,
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

        const { username, tag, isActive, campaignId } = req.body;
        if (username) account.username = username;
        if (tag !== undefined) account.tag = tag;
        if (isActive !== undefined) account.isActive = isActive;
        if (campaignId !== undefined) {
            account.campaignId = (campaignId === '' || campaignId === null || campaignId === undefined)
                ? null
                : parseInt(campaignId, 10);
        }

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

exports.getPosts = async (req, res) => {
    try {
        const { limit = 30, page = 1, accountId, tag } = req.query;
        let where = {};
        if (accountId) where.accountId = accountId;
        if (tag) where['$account.tag$'] = tag;

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
            include: [{ model: InstagramAccount, as: 'account', attributes: ['username', 'tag'] }],
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

exports.manualScrape = async (req, res) => {
    if (!scrapeAccount) {
        return res.status(503).json({ message: 'Servicio de scraping no disponible' });
    }
    try {
        const account = await InstagramAccount.findByPk(req.params.id);
        if (!account) return res.status(404).json({ message: 'Cuenta no encontrada' });
        await scrapeAccount(account);
        res.json({ message: `Scraping manual completado para @${account.username}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al ejecutar scraping manual' });
    }
};