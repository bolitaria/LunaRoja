const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const Action = require('../models/Action');
const Campaign = require('../models/Campaign');
const Subscriber = require('../models/Subscriber');
const Noticia = require('../models/News');
const Report = require('../models/Report');
const ChatGroup = require('../models/ChatGroup');
const User = require('../models/User');

exports.getDashboardData = async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // 1. Totales generales
    const [
      totalCampaigns,
      totalActions,
      totalNoticias,
      totalReports,
      totalSubscribers,
      totalChatGroups,
      totalUsers,
    ] = await Promise.all([
      Campaign.count(),
      Action.count(),
      Noticia.count(),
      Report.count(),
      Subscriber.count({ where: { status: 'active' } }),
      ChatGroup.count(),
      User.count(),
    ]);

    // 2. Acciones próximas (30 días)
    const upcomingActions = await Action.findAll({
      where: { datetime: { [Op.gte]: new Date() } },
      limit: 5,
      order: [['datetime', 'ASC']],
      include: [{ model: Campaign, as: 'campaign', attributes: ['name'] }],
    });

    // 3. Últimos suscriptores
    const recentSubscribers = await Subscriber.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['email', 'createdAt', 'status'],
    });

    // 4. Acciones por mes (últimos 6 meses)
    const actionsByMonth = await Action.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('datetime')), 'month'],
        [sequelize.fn('count', '*'), 'count'],
      ],
      where: { datetime: { [Op.gte]: sixMonthsAgo } },
      group: [sequelize.fn('date_trunc', 'month', sequelize.col('datetime'))],
      order: [[sequelize.fn('date_trunc', 'month', sequelize.col('datetime')), 'ASC']],
    });

    // 5. Suscriptores por mes (últimos 6 meses)
    const subscribersByMonth = await Subscriber.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('count', '*'), 'count'],
      ],
      where: { createdAt: { [Op.gte]: sixMonthsAgo } },
      group: [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'ASC']],
    });

    // 6. Acciones por categoría
    const actionsByCategory = await Action.findAll({
      attributes: ['category', [sequelize.fn('count', '*'), 'count']],
      group: ['category'],
    });

    // 7. Campañas con más acciones
    const topCampaigns = await Campaign.findAll({
      attributes: ['id', 'name', [sequelize.fn('count', sequelize.col('Actions.id')), 'actionCount']],
      include: [{ model: Action, as: 'actions', attributes: [] }],
      group: ['Campaign.id'],
      order: [[sequelize.literal('"actionCount"'), 'DESC']],
      limit: 5,
    });

    // 8. Últimas noticias
    const latestNews = await Noticia.findAll({
      limit: 5,
      order: [['publishedAt', 'DESC']],
      attributes: ['id', 'title', 'publishedAt'],
    });

    // 9. Próximas acciones a 7 días vista (alertas)
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const upcomingWeekActions = await Action.findAll({
      where: { datetime: { [Op.between]: [new Date(), weekFromNow] } },
      order: [['datetime', 'ASC']],
      include: [{ model: Campaign, as: 'campaign', attributes: ['name'] }],
    });

    res.json({
      totals: {
        campaigns: totalCampaigns,
        actions: totalActions,
        noticias: totalNoticias,
        reports: totalReports,
        subscribers: totalSubscribers,
        chatGroups: totalChatGroups,
        users: totalUsers,
      },
      upcomingActions,
      recentSubscribers,
      actionsByMonth: actionsByMonth.map(item => ({
        month: new Date(item.dataValues.month).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        count: parseInt(item.dataValues.count),
      })),
      subscribersByMonth: subscribersByMonth.map(item => ({
        month: new Date(item.dataValues.month).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        count: parseInt(item.dataValues.count),
      })),
      actionsByCategory: actionsByCategory.map(item => ({
        category: item.category || 'Sin categoría',
        count: parseInt(item.dataValues.count),
      })),
      topCampaigns: topCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        actionCount: parseInt(c.dataValues.actionCount),
      })),
      latestNews,
      upcomingWeekActions,
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ message: 'Error al obtener datos del dashboard' });
  }
};