const Video = require('../models/Video');
const { Op } = require('sequelize');

exports.getAllVideos = async (req, res) => {
  try {
    const { campaignId, actionId, isNews } = req.query;
    const where = {};

    if (campaignId) where.campaignId = campaignId;
    if (actionId) where.actionId = actionId;
    if (isNews !== undefined) where.isNews = isNews === 'true';

    const videos = await Video.findAll({
      where,
      order: [['publishedAt', 'DESC']]
    });
    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener videos' });
  }
};

exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video no encontrado' });
    res.json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener video' });
  }
};

exports.createVideo = async (req, res) => {
  try {
    const { title, description, youtubeUrl, thumbnail, isNews, campaignId, actionId } = req.body;
    if (!title || !youtubeUrl) {
      return res.status(400).json({ message: 'Título y URL de YouTube son requeridos' });
    }

    const video = await Video.create({
      title,
      description,
      youtubeUrl,
      thumbnail,
      isNews: isNews || false,
      campaignId: campaignId || null,
      actionId: actionId || null
    });
    res.status(201).json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear video' });
  }
};

exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video no encontrado' });

    const { title, description, youtubeUrl, thumbnail, isNews, campaignId, actionId } = req.body;
    await video.update({
      title,
      description,
      youtubeUrl,
      thumbnail,
      isNews,
      campaignId: campaignId || null,
      actionId: actionId || null
    });
    res.json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar video' });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video no encontrado' });
    await video.destroy();
    res.json({ message: 'Video eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar video' });
  }
};