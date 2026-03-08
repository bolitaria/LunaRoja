const Action = require('../models/Action');
const ActionImage = require('../models/ActionImage');
const fs = require('fs');
const path = require('path');

// Obtener todas las acciones (con filtro opcional por campaña)
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

    // Validaciones básicas
    if (!title || !datetime) {
      return res.status(400).json({ message: 'Título y fecha/hora son requeridos' });
    }

    // Validar que si es online, el enlace de registro es obligatorio
    if (locationType === 'online' && (!registrationLink || registrationLink.trim() === '')) {
      return res.status(400).json({ message: 'Para acciones online, el enlace de registro es obligatorio' });
    }

    // Sanitizar coordenadas
    if (!latitude && latitude !== 0) latitude = null;
    if (!longitude && longitude !== 0) longitude = null;
    if (latitude !== null && !isNaN(parseFloat(latitude))) latitude = parseFloat(latitude);
    if (longitude !== null && !isNaN(parseFloat(longitude))) longitude = parseFloat(longitude);

    // Procesar imagen destacada si se envió
    let featuredImage = null;
    if (req.files && req.files.featuredImage && req.files.featuredImage.length > 0) {
      featuredImage = `/uploads/featured/${req.files.featuredImage[0].filename}`;
    }

    // Crear la acción
    const action = await Action.create({
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive,
      campaignId: campaignId || null,
      featuredImage
    });

    // Guardar imágenes múltiples si se subieron
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

    // Devolver la acción con sus imágenes
    const actionWithImages = await Action.findByPk(action.id, {
      include: [{ model: ActionImage, as: 'images' }]
    });
    res.status(201).json(actionWithImages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear acción', error: error.message });
  }
};

// Actualizar una acción existente
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

    // Validar que si es online, el enlace de registro es obligatorio
    if (locationType === 'online' && (!registrationLink || registrationLink.trim() === '')) {
      return res.status(400).json({ message: 'Para acciones online, el enlace de registro es obligatorio' });
    }

    // Sanitizar coordenadas
    if (!latitude && latitude !== 0) latitude = null;
    if (!longitude && longitude !== 0) longitude = null;
    if (latitude !== null && !isNaN(parseFloat(latitude))) latitude = parseFloat(latitude);
    if (longitude !== null && !isNaN(parseFloat(longitude))) longitude = parseFloat(longitude);

    // Manejar imagen destacada
    let featuredImage = action.featuredImage;
    if (req.files && req.files.featuredImage && req.files.featuredImage.length > 0) {
      // Eliminar imagen anterior si existe
      if (action.featuredImage) {
        const oldPath = path.join(__dirname, '../../uploads/featured', path.basename(action.featuredImage));
        fs.unlink(oldPath, (err) => {
          if (err) console.error('Error al eliminar imagen destacada anterior:', err);
        });
      }
      featuredImage = `/uploads/featured/${req.files.featuredImage[0].filename}`;
    }

    // Actualizar datos de la acción
    await action.update({
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive,
      campaignId: campaignId || null,
      featuredImage
    });

    // Añadir nuevas imágenes múltiples si se subieron (sin eliminar las existentes)
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

// Eliminar una acción
exports.deleteAction = async (req, res) => {
  try {
    const action = await Action.findByPk(req.params.id, {
      include: [{ model: ActionImage, as: 'images' }]
    });
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    // Eliminar imagen destacada del disco
    if (action.featuredImage) {
      const filePath = path.join(__dirname, '../../uploads/featured', path.basename(action.featuredImage));
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error al eliminar imagen destacada:', err);
      });
    }

    // Eliminar imágenes múltiples del disco
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