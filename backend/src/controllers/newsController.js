const News = require('../models/News');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const { toInt, isValidId } = require('../utils/helpers');

exports.getAllNews = async (req, res) => {
  try {
    const { campaignId, actionId } = req.query;
    let where = {};
    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);

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

    if (parsedCampaignId) where.campaignId = parsedCampaignId;
    if (parsedActionId) where.actionId = parsedActionId;

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
    console.error('Error en getAllNews:', error);
    res.status(500).json({ message: 'Error al obtener noticias' });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const news = await News.findByPk(id);
    if (!news) return res.status(404).json({ message: 'Noticia no encontrada' });
    res.json(news);
  } catch (error) {
    console.error('Error en getNewsById:', error);
    res.status(500).json({ message: 'Error al obtener noticia' });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { title, description, youtubeUrl, thumbnail, isNews, campaignId, actionId } = req.body;
    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);

    if (!title || !youtubeUrl) {
      return res.status(400).json({ message: 'Título y URL de YouTube son requeridos' });
    }

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (!parsedCampaignId || !allowedCampaignIds.includes(parsedCampaignId)) {
        return res.status(403).json({ message: 'Debes seleccionar una campaña de las que administras' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para crear noticias' });
    }

    const news = await News.create({
      title,
      description: description || '',
      youtubeUrl,
      thumbnail: thumbnail || '',
      isNews: isNews || false,
      campaignId: parsedCampaignId,
      actionId: parsedActionId
    });
    res.status(201).json(news);
  } catch (error) {
    console.error('Error en createNews:', error);
    res.status(500).json({ message: 'Error al crear noticia' });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const news = await News.findByPk(id);
    if (!news) return res.status(404).json({ message: 'Noticia no encontrada' });

    const { title, description, youtubeUrl, thumbnail, isNews, campaignId, actionId } = req.body;
    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);

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

    await news.update({
      title: title || news.title,
      description: description !== undefined ? description : news.description,
      youtubeUrl: youtubeUrl || news.youtubeUrl,
      thumbnail: thumbnail !== undefined ? thumbnail : news.thumbnail,
      isNews: isNews !== undefined ? isNews : news.isNews,
      campaignId: parsedCampaignId,
      actionId: parsedActionId
    });
    res.json(news);
  } catch (error) {
    console.error('Error en updateNews:', error);
    res.status(500).json({ message: 'Error al actualizar noticia' });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const news = await News.findByPk(id);
    if (!news) return res.status(404).json({ message: 'Noticia no encontrada' });

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar noticias' });
    }

    await news.destroy();
    res.json({ message: 'Noticia eliminada' });
  } catch (error) {
    console.error('Error en deleteNews:', error);
    res.status(500).json({ message: 'Error al eliminar noticia' });
  }
};