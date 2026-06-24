const Action = require('../models/Action');
const ActionImage = require('../models/ActionImage');
const Campaign = require('../models/Campaign');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const Subscriber = require('../models/Subscriber');
const SubscribersReminder = require('../models/SubscribersReminder');
const { sendActionNotification } = require('../services/emailService');
const { toInt, isValidId, deleteFileSafe } = require('../utils/helpers');
const path = require('path');

const FEATURED_BASE = path.join(__dirname, '../../uploads/featured');
const ACTIONS_BASE = path.join(__dirname, '../../uploads/actions');
const DOCUMENTS_BASE = path.join(__dirname, '../../uploads/documents');

// ========== GET ALL ACTIONS ==========
exports.getAllActions = async (req, res) => {
  try {
    const { campaignId } = req.query;
    let where = {};
    const parsedCampaignId = toInt(campaignId);

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
        where.id = actionIds;
      }
    }

    if (parsedCampaignId) {
      where.campaignId = parsedCampaignId;
    }

    const actions = await Action.findAll({
      where,
      order: [['datetime', 'DESC']],
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] },
        { model: ActionImage, as: 'images', attributes: ['id', 'url', 'order'] }
      ]
    });

    res.json(actions);
  } catch (error) {
    console.error('Error en getAllActions:', error);
    res.status(500).json({ message: 'Error al obtener acciones' });
  }
};

// ========== GET ACTION BY ID ==========
exports.getActionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const action = await Action.findByPk(id, {
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] },
        { model: ActionImage, as: 'images', attributes: ['id', 'url', 'order'] }
      ]
    });
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });
    res.json(action);
  } catch (error) {
    console.error('Error en getActionById:', error);
    res.status(500).json({ message: 'Error al obtener acción' });
  }
};

// ========== CREATE ACTION ==========
exports.createAction = async (req, res) => {
  try {
    let {
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive, campaignId,
      groups, documentLink
    } = req.body;

    const parsedCampaignId = toInt(campaignId);
    if (groups && typeof groups === 'string') {
      try { groups = JSON.parse(groups); } catch (e) { groups = null; }
    }

    if (!title || !datetime) {
      return res.status(400).json({ message: 'Título y fecha/hora son requeridos' });
    }

    if (locationType === 'online' && (!registrationLink || registrationLink.trim() === '')) {
      return res.status(400).json({ message: 'Para acciones online, el enlace de registro es obligatorio' });
    }

    // Validar permisos según rol
    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (!parsedCampaignId || !allowedCampaignIds.includes(parsedCampaignId)) {
        return res.status(403).json({ message: 'Debes seleccionar una campaña de las que administras' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para crear acciones' });
    }

    // Sanitizar coordenadas
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      latitude = parseFloat(latitude);
      if (isNaN(latitude)) latitude = null;
    } else latitude = null;
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      longitude = parseFloat(longitude);
      if (isNaN(longitude)) longitude = null;
    } else longitude = null;

    let featuredImage = null;
    if (req.files && req.files.featuredImage && req.files.featuredImage.length > 0) {
      featuredImage = `/uploads/featured/${req.files.featuredImage[0].filename}`;
    }

    let documentPath = null;
    if (req.files && req.files.document && req.files.document.length > 0) {
      documentPath = `/uploads/documents/${req.files.document[0].filename}`;
    }

    const action = await Action.create({
      title, description: description || '', category, datetime,
      locationType: locationType || 'presencial',
      onlineLink: onlineLink || '',
      placeName: placeName || '',
      address: address || '',
      latitude, longitude,
      registrationLink: registrationLink || '',
      recordingUrl: recordingUrl || '',
      isLive: isLive !== undefined ? isLive : true,
      campaignId: parsedCampaignId,
      featuredImage,
      groups: groups || [],
      documentLink: documentLink || null,
      document: documentPath
    });

    // Procesar imágenes adicionales
    if (req.files && req.files.images && req.files.images.length > 0) {
      const imagePromises = req.files.images.map((file, index) => {
        const url = `/uploads/actions/${file.filename}`;
        return ActionImage.create({ url, actionId: action.id, order: index });
      });
      await Promise.all(imagePromises);
    }

    // Notificar a suscriptores (con manejo robusto de campaña)
    try {
      const subscribers = await Subscriber.findAll({ where: { status: 'active' } });
      const campaign = await action.getCampaign().catch(() => null);
      if (campaign) {
        for (const sub of subscribers) {
          await sendActionNotification(sub.email, action, campaign)
            .catch(err => console.error(`Error email a ${sub.email}:`, err));
        }
        console.log(`Notificaciones de acción enviadas a ${subscribers.length} suscriptores`);
      } else {
        console.warn('No se encontró campaña asociada a la acción, omitiendo notificaciones');
      }
    } catch (emailError) {
      console.error('Error al enviar notificaciones de acción:', emailError);
    }

    // Crear recordatorios
    try {
      const reminderSubscribers = await Subscriber.findAll({ where: { status: 'active', sendReminders: true } });
      const actionDate = new Date(datetime);
      const reminderDate = new Date(actionDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      reminderDate.setHours(9, 0, 0, 0);
      for (const sub of reminderSubscribers) {
        await SubscribersReminder.create({
          actionId: action.id,
          subscriberId: sub.id,
          scheduledAt: reminderDate,
          sent: false,
        });
      }
      console.log(`Creados ${reminderSubscribers.length} recordatorios para la acción ${action.id}`);
    } catch (reminderError) {
      console.error('Error al crear recordatorios:', reminderError);
    }

    // Devolver con imágenes
    const actionWithImages = await Action.findByPk(action.id, {
      include: [{ model: ActionImage, as: 'images' }]
    });
    res.status(201).json(actionWithImages);
  } catch (error) {
    console.error('Error en createAction:', error);
    res.status(500).json({ message: 'Error al crear acción' });
  }
};

// ========== UPDATE ACTION ==========
exports.updateAction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const action = await Action.findByPk(id, {
      include: [{ model: ActionImage, as: 'images' }]
    });
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    let {
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive, campaignId,
      groups, documentLink
    } = req.body;

    let parsedCampaignId = toInt(campaignId);

    // Permisos
    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (!allowedCampaignIds.includes(action.campaignId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta acción' });
      }
      parsedCampaignId = action.campaignId; // Forzar mantener la campaña original
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

    // Sanitizar coordenadas
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      latitude = parseFloat(latitude);
      if (isNaN(latitude)) latitude = null;
    } else latitude = null;
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      longitude = parseFloat(longitude);
      if (isNaN(longitude)) longitude = null;
    } else longitude = null;

    if (groups && typeof groups === 'string') {
      try { groups = JSON.parse(groups); } catch (e) { groups = null; }
    }

    let featuredImage = action.featuredImage;
    if (req.files && req.files.featuredImage && req.files.featuredImage.length > 0) {
      if (action.featuredImage) {
        deleteFileSafe(action.featuredImage, FEATURED_BASE);
      }
      featuredImage = `/uploads/featured/${req.files.featuredImage[0].filename}`;
    }

    let documentPath = action.document;
    if (req.files && req.files.document && req.files.document.length > 0) {
      if (action.document) {
        deleteFileSafe(action.document, DOCUMENTS_BASE);
      }
      documentPath = `/uploads/documents/${req.files.document[0].filename}`;
    }

    await action.update({
      title: title || action.title,
      description: description !== undefined ? description : action.description,
      category: category || action.category,
      datetime: datetime || action.datetime,
      locationType: locationType || action.locationType,
      onlineLink: onlineLink !== undefined ? onlineLink : action.onlineLink,
      placeName: placeName !== undefined ? placeName : action.placeName,
      address: address !== undefined ? address : action.address,
      latitude,
      longitude,
      registrationLink: registrationLink !== undefined ? registrationLink : action.registrationLink,
      recordingUrl: recordingUrl !== undefined ? recordingUrl : action.recordingUrl,
      isLive: isLive !== undefined ? isLive : action.isLive,
      campaignId: parsedCampaignId,
      featuredImage,
      groups: groups || [],
      documentLink: documentLink !== undefined ? documentLink : action.documentLink,
      document: documentPath
    });

    if (req.files && req.files.images && req.files.images.length > 0) {
      const currentImageCount = action.images ? action.images.length : 0;
      const imagePromises = req.files.images.map((file, index) => {
        const url = `/uploads/actions/${file.filename}`;
        return ActionImage.create({ url, actionId: action.id, order: currentImageCount + index });
      });
      await Promise.all(imagePromises);
    }

    const updatedAction = await Action.findByPk(action.id, {
      include: [{ model: ActionImage, as: 'images' }]
    });
    res.json(updatedAction);
  } catch (error) {
    console.error('Error en updateAction:', error);
    res.status(500).json({ message: 'Error al actualizar acción' });
  }
};

// ========== DELETE ACTION ==========
exports.deleteAction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const action = await Action.findByPk(id, {
      include: [{ model: ActionImage, as: 'images' }]
    });
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar acciones' });
    }

    if (action.featuredImage) {
      deleteFileSafe(action.featuredImage, FEATURED_BASE);
    }
    if (action.images && action.images.length > 0) {
      for (const img of action.images) {
        deleteFileSafe(img.url, ACTIONS_BASE);
      }
    }
    if (action.document) {
      deleteFileSafe(action.document, DOCUMENTS_BASE);
    }

    await action.destroy();
    res.json({ message: 'Acción eliminada' });
  } catch (error) {
    console.error('Error en deleteAction:', error);
    res.status(500).json({ message: 'Error al eliminar acción' });
  }
};

// ========== DELETE ACTION IMAGE ==========
exports.deleteActionImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    if (!isValidId(imageId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const image = await ActionImage.findByPk(imageId);
    if (!image) return res.status(404).json({ message: 'Imagen no encontrada' });

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta imagen' });
    }

    deleteFileSafe(image.url, ACTIONS_BASE);
    await image.destroy();
    res.json({ message: 'Imagen eliminada' });
  } catch (error) {
    console.error('Error en deleteActionImage:', error);
    res.status(500).json({ message: 'Error al eliminar imagen' });
  }
};