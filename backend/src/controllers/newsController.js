const News = require('../models/News');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');

exports.getAllNews = async (req, res) => {
  try {
    const { campaignId, actionId } = req.query;
    let where = {};

    if (req.user) {
      if (req.user.role === 'campaign_admin') {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const campaignIds = userCampaigns.map(uc => uc.campaignId);
        if (campaignIds.length === 0) return res.json([]);
        where.campaignId = campaignIds;
      } else if (req.user.role === 'action_admin') {
        const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
        const actionIds = userActions.map(ua => ua.actionId);
        if (actionIds.length === 0) return res.json([]);
        where.actionId = actionIds;
      }
    }

    if (campaignId) where.campaignId = campaignId;
    if (actionId) where.actionId = actionId;

    const news = await News.findAll({
      where,
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] },
        { model: Action, as: 'action', attributes: ['id', 'title'] }
      ],
      order: [['publishedAt', 'DESC']]
    });

    const formattedNews = news.map(n => ({
      id: n.id,
      title: n.title,
      description: n.description,
      youtubeUrl: n.youtubeUrl,
      thumbnail: n.thumbnail,
      publishedAt: n.publishedAt,
      isNews: n.isNews,
      campaignId: n.campaignId,
      actionId: n.actionId,
      campaign: n.campaign ? { id: n.campaign.id, name: n.campaign.name, color: n.campaign.color } : null,
      action: n.action ? { id: n.action.id, title: n.action.title } : null,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt
    }));

    res.json(formattedNews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener noticias' });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    if (!news) return res.status(404).json({ message: 'Noticia no encontrada' });
    res.json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener noticia' });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { title, description, youtubeUrl, thumbnail, isNews, campaignId, actionId } = req.body;

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (!campaignId || !allowedCampaignIds.includes(parseInt(campaignId))) {
        return res.status(403).json({ message: 'Debes seleccionar una campaña de las que administras' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para crear noticias' });
    }

    if (!title || !youtubeUrl) {
      return res.status(400).json({ message: 'Título y URL de YouTube son requeridos' });
    }

    const finalCampaignId = campaignId ? parseInt(campaignId) : null;
    const finalActionId = actionId ? parseInt(actionId) : null;

    const news = await News.create({ 
      title, 
      description, 
      youtubeUrl, 
      thumbnail, 
      isNews: isNews || false,
      campaignId: finalCampaignId,
      actionId: finalActionId
    });
    res.status(201).json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear noticia' });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    if (!news) return res.status(404).json({ message: 'Noticia no encontrada' });

    const { title, description, youtubeUrl, thumbnail, isNews, campaignId, actionId } = req.body;

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (news.campaignId && !allowedCampaignIds.includes(news.campaignId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta noticia' });
      }
    } else if (req.user.role === 'action_admin') {
      const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
      const allowedActionIds = userActions.map(ua => ua.actionId);
      if (news.actionId && !allowedActionIds.includes(news.actionId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta noticia' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const finalCampaignId = campaignId ? parseInt(campaignId) : null;
    const finalActionId = actionId ? parseInt(actionId) : null;

    await news.update({ 
      title, 
      description, 
      youtubeUrl, 
      thumbnail, 
      isNews, 
      campaignId: finalCampaignId, 
      actionId: finalActionId 
    });
    res.json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar noticia' });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    if (!news) return res.status(404).json({ message: 'Noticia no encontrada' });

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar noticias' });
    }

    await news.destroy();
    res.json({ message: 'Noticia eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar noticia' });
  }
};