// backend/src/controllers/newsController.js
const { Op } = require('sequelize');
const News = require('../models/News');
const Campaign = require('../models/Campaign');
const Action = require('../models/Action');
const { toInt, isValidId } = require('../utils/helpers');
const { logAdminAction } = require('../services/auditService');
const cacheMiddleware = require('../middlewares/cache');
const { scrapeArticle } = require('../services/articleScraper');

exports.getAllNews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      campaignId,
      actionId,
      isNews,
      hasYoutube,
      hasThumbnail,
      hasAction,
      hasCampaign,
      dateFrom,
      dateTo,
      sortBy = 'publishedAt',
      sortOrder = 'DESC',
    } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);
    if (parsedCampaignId) where.campaignId = parsedCampaignId;
    if (parsedActionId) where.actionId = parsedActionId;

    if (isNews === 'true') where.isNews = true;
    else if (isNews === 'false') where.isNews = false;

    if (hasYoutube === 'true') where.youtubeUrl = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };
    else if (hasYoutube === 'false') where.youtubeUrl = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] };

    if (hasThumbnail === 'true') where.thumbnail = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };
    else if (hasThumbnail === 'false') where.thumbnail = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] };

    if (hasAction === 'true') where.actionId = { [Op.ne]: null };
    else if (hasAction === 'false') where.actionId = { [Op.is]: null };

    if (hasCampaign === 'true') where.campaignId = { [Op.ne]: null };
    else if (hasCampaign === 'false') where.campaignId = { [Op.is]: null };

    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) dateFilter[Op.gte] = new Date(dateFrom);
      if (dateTo) dateFilter[Op.lte] = new Date(dateTo + 'T23:59:59');
      where.publishedAt = dateFilter;
    }

    const parsedPage = Math.max(1, parseInt(page) || 1);
    let parsedLimit = parseInt(limit) || 12;
    if (parsedLimit < 1) parsedLimit = 1;
    if (parsedLimit > 100) parsedLimit = 100;
    const offset = (parsedPage - 1) * parsedLimit;

    const orderField = ['publishedAt', 'createdAt', 'title'].includes(sortBy) ? sortBy : 'publishedAt';
    const orderDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [total, rows, withYoutube, withThumbnail, linked] = await Promise.all([
      News.count({ where }),
      News.findAll({
        where,
        limit: parsedLimit,
        offset,
        order: [[orderField, orderDir]],
        include: [
          { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'], required: false },
          { model: Action, as: 'action', attributes: ['id', 'title', 'datetime'], required: false },
        ],
      }),
      News.count({ where: { ...where, youtubeUrl: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } } }),
      News.count({ where: { ...where, thumbnail: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } } }),
      News.count({ where: { ...where, [Op.or]: [{ campaignId: { [Op.ne]: null } }, { actionId: { [Op.ne]: null } }] } }),
    ]);

    res.json({
      data: rows,
      total,
      page: parsedPage,
      limit: parsedLimit,
      metrics: { total, withYoutube, withThumbnail, linked },
    });
  } catch (error) {
    console.error('Error en getAllNews:', error);
    res.status(500).json({ message: 'Error al obtener noticias' });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const news = await News.findByPk(id, {
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'], required: false },
        { model: Action, as: 'action', attributes: ['id', 'title', 'datetime'], required: false },
      ],
    });
    if (!news) return res.status(404).json({ message: 'Noticia no encontrada' });
    res.json(news);
  } catch (error) {
    console.error('Error en getNewsById:', error);
    res.status(500).json({ message: 'Error al obtener noticia' });
  }
};

exports.createNews = async (req, res) => {
  try {
    const {
      title, description, thumbnail, publishedAt, isNews, campaignId, actionId,
      newsType = 'youtube',
      youtubeUrl, externalUrl, source, ogImage, ogDescription, publishedAtSource, scrapedAt,
      content,
    } = req.body;

    if (!title) return res.status(400).json({ message: 'Título requerido' });
    if (newsType === 'youtube' && !youtubeUrl) {
      return res.status(400).json({ message: 'URL de YouTube requerida para este tipo' });
    }
    if (newsType === 'article' && !externalUrl) {
      return res.status(400).json({ message: 'URL externa requerida para artículos' });
    }

    const parsedCampaignId = toInt(campaignId);
    const parsedActionId = toInt(actionId);

    const news = await News.create({
      title,
      description: description || '',
      newsType,
      youtubeUrl: newsType === 'youtube' ? (youtubeUrl || null) : null,
      externalUrl: newsType === 'article' ? (externalUrl || null) : null,
      source: source || null,
      ogImage: ogImage || null,
      ogDescription: ogDescription || null,
      publishedAtSource: publishedAtSource || null,
      scrapedAt: scrapedAt || null,
      content: newsType === 'internal' ? (content || '') : null,
      thumbnail: thumbnail || null,
      publishedAt: publishedAt || new Date(),
      isNews: isNews !== undefined ? isNews : false,
      campaignId: parsedCampaignId || null,
      actionId: parsedActionId || null,
    });

    await cacheMiddleware.invalidateResource('news', news.id);

    await logAdminAction(req, {
      action: 'create',
      entityType: 'news',
      entityId: news.id,
      metadata: { title: news.title },
    });

    res.status(201).json(news);
  } catch (error) {
    console.error('Error en createNews:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: 'Error al crear noticia' });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const news = await News.findByPk(id);
    if (!news) return res.status(404).json({ message: 'Noticia no encontrada' });

    const {
      title, description, thumbnail, publishedAt, isNews, campaignId, actionId,
      newsType,
      youtubeUrl, externalUrl, source, ogImage, ogDescription, publishedAtSource, scrapedAt,
      content,
    } = req.body;

    const parsedCampaignId = campaignId !== undefined ? toInt(campaignId) : news.campaignId;
    const parsedActionId = actionId !== undefined ? toInt(actionId) : news.actionId;

    const finalType = newsType !== undefined ? newsType : news.newsType;

    await news.update({
      title: title !== undefined ? title : news.title,
      description: description !== undefined ? description : news.description,
      newsType: finalType,
      youtubeUrl: finalType === 'youtube'
        ? (youtubeUrl !== undefined ? youtubeUrl : news.youtubeUrl)
        : null,
      externalUrl: finalType === 'article'
        ? (externalUrl !== undefined ? externalUrl : news.externalUrl)
        : null,
      source: source !== undefined ? source : news.source,
      ogImage: ogImage !== undefined ? ogImage : news.ogImage,
      ogDescription: ogDescription !== undefined ? ogDescription : news.ogDescription,
      publishedAtSource: publishedAtSource !== undefined ? publishedAtSource : news.publishedAtSource,
      scrapedAt: scrapedAt !== undefined ? scrapedAt : news.scrapedAt,
      content: finalType === 'internal'
        ? (content !== undefined ? content : news.content)
        : null,
      thumbnail: thumbnail !== undefined ? thumbnail : news.thumbnail,
      publishedAt: publishedAt !== undefined ? publishedAt : news.publishedAt,
      isNews: isNews !== undefined ? isNews : news.isNews,
      campaignId: parsedCampaignId,
      actionId: parsedActionId,
    });

    await cacheMiddleware.invalidateResource('news', id);

    await logAdminAction(req, {
      action: 'update',
      entityType: 'news',
      entityId: id,
      metadata: { changed: Object.keys(req.body) },
    });

    res.json(news);
  } catch (error) {
    console.error('Error en updateNews:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: 'Error al actualizar noticia' });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const news = await News.findByPk(id);
    if (!news) return res.status(404).json({ message: 'Noticia no encontrada' });

    const snapshot = { title: news.title, youtubeUrl: news.youtubeUrl };
    await news.destroy();

    await cacheMiddleware.invalidateResource('news', id);

    await logAdminAction(req, {
      action: 'delete',
      entityType: 'news',
      entityId: id,
      metadata: snapshot,
    });

    res.json({ message: 'Noticia eliminada' });
  } catch (error) {
    console.error('Error en deleteNews:', error);
    res.status(500).json({ message: 'Error al eliminar noticia' });
  }
};

/**
 * POST /api/news/scrape
 * Body: { url: string }
 * Extrae metadatos OG de una URL (periódicos, blogs, YouTube...).
 */
exports.scrapeUrl = async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'URL requerida' });
    }
    if (url.length > 2000) {
      return res.status(400).json({ message: 'URL demasiado larga' });
    }

    const data = await scrapeArticle(url);
    res.json(data);
  } catch (error) {
    console.error('scrapeUrl error:', error.message);
    res.status(422).json({
      message: error.message || 'No se pudo extraer la información de la URL',
    });
  }
};
