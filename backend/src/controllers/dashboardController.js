const { Op } = require('sequelize');
const Action = require('../models/Action');
const Campaign = require('../models/Campaign');
const Noticia = require('../models/News');
const Report = require('../models/Report');
const ChatGroup = require('../models/ChatGroup');
const User = require('../models/User');

exports.getDashboardData = async (req, res) => {
  try {
    const [
      totalCampaigns,
      totalActions,
      totalNoticias,
      totalReports,
      totalChatGroups,
      totalUsers,
    ] = await Promise.all([
      Campaign.count(),
      Action.count(),
      Noticia.count(),
      Report.count(),
      ChatGroup.count(),
      User.count(),
    ]);

    // Próximas acciones (sin include problemático)
    const upcomingActions = await Action.findAll({
      where: { datetime: { [Op.gte]: new Date() } },
      limit: 5,
      order: [['datetime', 'ASC']],
      attributes: ['id', 'title', 'datetime'],
    });

    res.json({
      totals: {
        campaigns: totalCampaigns,
        actions: totalActions,
        noticias: totalNoticias,
        reports: totalReports,
        subscribers: 0,               // valor temporal
        chatGroups: totalChatGroups,
        users: totalUsers,
      },
      upcomingActions,
      recentSubscribers: [],          // sin consulta a Subscriber
      actionsByMonth: [],
      subscribersByMonth: [],
      actionsByCategory: [],
      topCampaigns: [],
      latestNews: [],
      upcomingWeekActions: [],
    });
  } catch (error) {
    console.error('❌ Error en dashboard:', error);
    res.status(500).json({ message: 'Error al obtener datos del dashboard' });
  }
};