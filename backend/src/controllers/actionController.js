const Action = require('../models/Action');
const ActionImage = require('../models/ActionImage');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const fs = require('fs');
const path = require('path');

exports.getAllActions = async (req, res) => {
  try {
    const { campaignId } = req.query;
    let where = {};

    console.log('=== getAllActions ===');
    console.log('req.user:', req.user);

    if (req.user) {
      if (req.user.role === 'campaign_admin') {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const campaignIds = userCampaigns.map(uc => uc.campaignId);
        console.log('campaignIds del usuario (campaign_admin):', campaignIds);
        if (campaignIds.length === 0) return res.json([]);
        where.campaignId = campaignIds;
      } else if (req.user.role === 'action_admin') {
        const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
        const actionIds = userActions.map(ua => ua.actionId);
        console.log('actionIds del usuario (action_admin):', actionIds);
        if (actionIds.length === 0) return res.json([]);
        where.id = actionIds;
      }
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    const actions = await Action.findAll({
      where,
      order: [['datetime', 'DESC']],
      include: [{ model: ActionImage, as: 'images', attributes: ['id', 'url', 'order'] }]
    });
    console.log('Acciones devueltas:', actions.map(a => a.id));
    res.json(actions);
  } catch (error) {
    console.error('Error en getAllActions:', error);
    res.status(500).json({ message: 'Error al obtener acciones' });
  }
};

// ... resto del controlador
// Obtener una acción por ID
exports.getActionById = async (req, res) => {
  try {
    const action = await Action.findByPk(req.params.id, {
      include: [{ model: ActionImage, as: 'images', attributes: ['id', 'url', 'order'] }]
    });
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });
    res.json(action);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener acción' });
  }
};

// Crear una nueva acción
exports.createAction = async (req, res) => {
  try {
    let {
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive, campaignId
    } = req.body;

    // Validar permisos según rol
    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (!campaignId || !allowedCampaignIds.includes(parseInt(campaignId))) {
        return res.status(403).json({ message: 'Debes seleccionar una campaña de las que administras' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para crear acciones' });
    }

    if (!title || !datetime) {
      return res.status(400).json({ message: 'Título y fecha/hora son requeridos' });
    }

    if (locationType === 'online' && (!registrationLink || registrationLink.trim() === '')) {
      return res.status(400).json({ message: 'Para acciones online, el enlace de registro es obligatorio' });
    }

    // Sanitizar coordenadas
    if (!latitude && latitude !== 0) latitude = null;
    if (!longitude && longitude !== 0) longitude = null;
    if (latitude !== null && !isNaN(parseFloat(latitude))) latitude = parseFloat(latitude);
    if (longitude !== null && !isNaN(parseFloat(longitude))) longitude = parseFloat(longitude);

    let featuredImage = null;
    if (req.files && req.files.featuredImage && req.files.featuredImage.length > 0) {
      featuredImage = `/uploads/featured/${req.files.featuredImage[0].filename}`;
    }

    const action = await Action.create({
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive,
      campaignId: campaignId || null,
      featuredImage
    });

    if (req.files && req.files.images && req.files.images.length > 0) {
      const imagePromises = req.files.images.map((file, index) => {
        const url = `/uploads/actions/${file.filename}`;
        return ActionImage.create({
          url,
          actionId: action.id,
          order: index
        });
      });
      await Promise.all(imagePromises);
    }

    const actionWithImages = await Action.findByPk(action.id, {
      include: [{ model: ActionImage, as: 'images' }]
    });
    res.status(201).json(actionWithImages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear acción', error: error.message });
  }
};

// Actualizar una acción
exports.updateAction = async (req, res) => {
  try {
    const action = await Action.findByPk(req.params.id, {
      include: [{ model: ActionImage, as: 'images' }]
    });
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    let {
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive, campaignId
    } = req.body;

    // Verificar permisos
    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (!allowedCampaignIds.includes(action.campaignId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta acción' });
      }
      // No puede cambiar la campaña
      campaignId = action.campaignId;
    } else if (req.user.role === 'action_admin') {
      const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
      const allowedActionIds = userActions.map(ua => ua.actionId);
      if (!allowedActionIds.includes(action.id)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta acción' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    if (locationType === 'online' && (!registrationLink || registrationLink.trim() === '')) {
      return res.status(400).json({ message: 'Para acciones online, el enlace de registro es obligatorio' });
    }

    if (!latitude && latitude !== 0) latitude = null;
    if (!longitude && longitude !== 0) longitude = null;
    if (latitude !== null && !isNaN(parseFloat(latitude))) latitude = parseFloat(latitude);
    if (longitude !== null && !isNaN(parseFloat(longitude))) longitude = parseFloat(longitude);

    let featuredImage = action.featuredImage;
    if (req.files && req.files.featuredImage && req.files.featuredImage.length > 0) {
      if (action.featuredImage) {
        const oldPath = path.join(__dirname, '../../uploads/featured', path.basename(action.featuredImage));
        fs.unlink(oldPath, (err) => {
          if (err) console.error('Error al eliminar imagen destacada anterior:', err);
        });
      }
      featuredImage = `/uploads/featured/${req.files.featuredImage[0].filename}`;
    }

    await action.update({
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive,
      campaignId,
      featuredImage
    });

    if (req.files && req.files.images && req.files.images.length > 0) {
      const currentImageCount = action.images ? action.images.length : 0;
      const imagePromises = req.files.images.map((file, index) => {
        const url = `/uploads/actions/${file.filename}`;
        return ActionImage.create({
          url,
          actionId: action.id,
          order: currentImageCount + index
        });
      });
      await Promise.all(imagePromises);
    }

    const updatedAction = await Action.findByPk(action.id, {
      include: [{ model: ActionImage, as: 'images' }]
    });
    res.json(updatedAction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar acción' });
  }
};

// Eliminar una acción (solo superadmin)
exports.deleteAction = async (req, res) => {
  try {
    const action = await Action.findByPk(req.params.id, {
      include: [{ model: ActionImage, as: 'images' }]
    });
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar acciones' });
    }

    if (action.featuredImage) {
      const filePath = path.join(__dirname, '../../uploads/featured', path.basename(action.featuredImage));
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error al eliminar imagen destacada:', err);
      });
    }
    if (action.images && action.images.length > 0) {
      for (const img of action.images) {
        const filePath = path.join(__dirname, '../../uploads/actions', path.basename(img.url));
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error al eliminar imagen:', err);
        });
      }
    }
    await action.destroy();
    res.json({ message: 'Acción eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar acción' });
  }
};

// Eliminar una imagen específica de una acción
exports.deleteActionImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await ActionImage.findByPk(imageId);
    if (!image) return res.status(404).json({ message: 'Imagen no encontrada' });

    const filePath = path.join(__dirname, '../../uploads/actions', path.basename(image.url));
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error al eliminar archivo:', err);
    });
    await image.destroy();
    res.json({ message: 'Imagen eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar imagen' });
  }
};