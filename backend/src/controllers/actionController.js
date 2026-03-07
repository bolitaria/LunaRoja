const Action = require('../models/Action');
const ActionImage = require('../models/ActionImage');
const fs = require('fs');
const path = require('path');

exports.getAllActions = async (req, res) => {
  try {
    const { campaignId } = req.query;
    const where = {};
    if (campaignId) where.campaignId = campaignId;
    const actions = await Action.findAll({
      where,
      order: [['datetime', 'DESC']],
      include: [{ model: ActionImage, as: 'images', attributes: ['id', 'url', 'order'] }]
    });
    res.json(actions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener acciones' });
  }
};

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

exports.createAction = async (req, res) => {
  try {
    let {
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive, campaignId
    } = req.body;

    if (!title || !datetime) {
      return res.status(400).json({ message: 'Título y fecha/hora son requeridos' });
    }

    // Sanitizar coordenadas
    if (!latitude && latitude !== 0) latitude = null;
    if (!longitude && longitude !== 0) longitude = null;
    if (latitude !== null && !isNaN(parseFloat(latitude))) latitude = parseFloat(latitude);
    if (longitude !== null && !isNaN(parseFloat(longitude))) longitude = parseFloat(longitude);

    // Crear acción
    const action = await Action.create({
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive,
      campaignId: campaignId || null
    });

    // Guardar imágenes
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map((file, index) => {
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

    // Sanitizar coordenadas
    if (!latitude && latitude !== 0) latitude = null;
    if (!longitude && longitude !== 0) longitude = null;
    if (latitude !== null && !isNaN(parseFloat(latitude))) latitude = parseFloat(latitude);
    if (longitude !== null && !isNaN(parseFloat(longitude))) longitude = parseFloat(longitude);

    // Actualizar datos de la acción
    await action.update({
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive, campaignId
    });

    // Añadir nuevas imágenes si se subieron (sin eliminar las existentes)
    if (req.files && req.files.length > 0) {
      const currentImageCount = action.images ? action.images.length : 0;
      const imagePromises = req.files.map((file, index) => {
        const url = `/uploads/actions/${file.filename}`;
        return ActionImage.create({
          url,
          actionId: action.id,
          order: currentImageCount + index
        });
      });
      await Promise.all(imagePromises);
    }

    // Devolver acción actualizada
    const updatedAction = await Action.findByPk(action.id, {
      include: [{ model: ActionImage, as: 'images' }]
    });
    res.json(updatedAction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar acción' });
  }
};

exports.deleteAction = async (req, res) => {
  try {
    const action = await Action.findByPk(req.params.id, {
      include: [{ model: ActionImage, as: 'images' }]
    });
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    // Eliminar archivos de imágenes del disco
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
    if (!image) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    // Eliminar archivo físico
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