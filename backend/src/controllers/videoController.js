const Video = require('../models/Video');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');

// Obtener todos los videos (público o admin)
exports.getAllVideos = async (req, res) => {
  try {
    const { campaignId, actionId } = req.query;
    let where = {};

    if (req.user) {
      if (req.user.role === 'campaign_admin') {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const campaignIds = userCampaigns.map(uc => uc.campaignId);
        if (campaignIds.length === 0) {
          return res.json([]);
        }
        where.campaignId = campaignIds;
      } else if (req.user.role === 'action_admin') {
        const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
        const actionIds = userActions.map(ua => ua.actionId);
        if (actionIds.length === 0) {
          return res.json([]);
        }
        where.actionId = actionIds;
      }
    }

    if (campaignId) where.campaignId = campaignId;
    if (actionId) where.actionId = actionId;

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

// Obtener un video por ID (público)
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

// Crear un nuevo video (solo superadmin o campaign_admin)
exports.createVideo = async (req, res) => {
  try {
    const { title, description, youtubeUrl, thumbnail, isNews, campaignId, actionId } = req.body;

    // Verificar permisos
    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (!campaignId || !allowedCampaignIds.includes(parseInt(campaignId))) {
        return res.status(403).json({ message: 'Debes seleccionar una campaña de las que administras' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para crear videos' });
    }

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

// Actualizar un video
exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video no encontrado' });

    const { title, description, youtubeUrl, thumbnail, isNews, campaignId, actionId } = req.body;

    // Verificar permisos según rol
    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (!video.campaignId || !allowedCampaignIds.includes(video.campaignId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar este video' });
      }
    } else if (req.user.role === 'action_admin') {
      const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
      const allowedActionIds = userActions.map(ua => ua.actionId);
      if (!video.actionId || !allowedActionIds.includes(video.actionId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar este video' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    await video.update({ title, description, youtubeUrl, thumbnail, isNews, campaignId, actionId });
    res.json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar video' });
  }
};

// Eliminar un video (solo superadmin)
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video no encontrado' });

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar videos' });
    }

    await video.destroy();
    res.json({ message: 'Video eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar video' });
  }
};