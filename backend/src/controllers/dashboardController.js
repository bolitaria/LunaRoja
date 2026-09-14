const { Op } = require('sequelize');
const sequelize = require('../config/database');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const Subscriber = require('../models/Subscriber');
const Petition = require('../models/Petition');
const BDS = require('../models/BDS');
const News = require('../models/News');
const UserAction = require('../models/UserAction');
const UserCampaign = require('../models/UserCampaign');

exports.getDashboardData = async (req, res) => {
  try {
    // 1. Totales básicos
    const [
      totalUsers,
      totalCampaigns,
      totalActions,
      totalSubscribers,
      totalPetitions,
      totalBDS,
      totalNews,
    ] = await Promise.all([
      User.count(),
      Campaign.count(),
      Action.count(),
      Subscriber.count({ where: { status: 'active' } }),
      Petition.count(),
      BDS.count(),
      News.count(),
    ]);

    // 2. Total de imágenes (galería + principales)
    const allActions = await Action.findAll({
      attributes: ['imageUrl', 'galleryImages'],
      raw: true,
    });

    let totalImages = 0;
    allActions.forEach(action => {
      if (action.imageUrl) totalImages += 1; // imagen principal
      if (Array.isArray(action.galleryImages)) {
        totalImages += action.galleryImages.length; // galería
      }
    });

    // 3. Seguidores
    const followersActions = await UserAction.count();
    const followersCampaigns = await UserCampaign.count();

    // 4. Registros últimos 30 días
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const registrations = await User.findAll({
      attributes: ['createdAt'],
      where: { createdAt: { [Op.gte]: last30Days } },
      order: [['createdAt', 'ASC']],
      raw: true,
    });

    const registrationsByDay = {};
    registrations.forEach(user => {
      const day = user.createdAt.toISOString().split('T')[0];
      registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
    });
    const registrationsLast30Days = Object.keys(registrationsByDay).map(date => ({
      date,
      count: registrationsByDay[date],
    }));

    // 5. Distribución de categorías de acciones
    const actionsByCategoryRaw = await Action.findAll({
      attributes: ['category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['category'],
      raw: true,
    });
    const actionsByCategory = actionsByCategoryRaw.map(item => ({
      category: item.category,
      count: parseInt(item.count, 10),
    }));

    // 6. Actividad reciente (últimas 5 campañas y acciones)
    const recentCampaigns = await Campaign.findAll({
      attributes: ['id', 'name', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5,
      raw: true,
    });
    const recentActions = await Action.findAll({
      attributes: ['id', 'title', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5,
      raw: true,
    });
    const recentActivity = [
      ...recentCampaigns.map(c => ({ type: 'Campaña', name: c.name, date: c.createdAt })),
      ...recentActions.map(a => ({ type: 'Acción', name: a.title, date: a.createdAt })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    // 7. Próximas acciones
    const upcomingActions = await Action.findAll({
      where: { datetime: { [Op.gte]: new Date() } },
      order: [['datetime', 'ASC']],
      limit: 5,
      attributes: ['id', 'title', 'datetime'],
      raw: true,
    });

    res.json({
      totals: {
        users: totalUsers,
        campaigns: totalCampaigns,
        actions: totalActions,
        subscribers: totalSubscribers,
        petitions: totalPetitions,
        images: totalImages,
        bds: totalBDS,
        noticias: totalNews,
        news: totalNews,
        followersActions,
        followersCampaigns,
      },
      registrationsLast30Days,
      actionsByCategory,
      recentActivity,
      upcomingActions,
    });
  } catch (error) {
    console.error('❌ Error en dashboard:', error);
    res.status(500).json({ message: 'Error al obtener datos del dashboard' });
  }
};