const Action = require('../models/Action');
const ActionImage = require('../models/ActionImage');
const Campaign = require('../models/Campaign');
const BDS = require('../models/BDS');
const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const UserBDS = require('../models/UserBDS');
const Subscriber = require('../models/Subscriber');
const SubscribersReminder = require('../models/SubscribersReminder');
const { sendActionNotification } = require('../services/emailService');
const { toInt, isValidId, deleteFileSafe } = require('../utils/helpers');
const path = require('path');

const FEATURED_BASE = path.join(__dirname, '../../uploads/featured');
const ACTIONS_BASE = path.join(__dirname, '../../uploads/actions');
const DOCUMENTS_BASE = path.join(__dirname, '../../uploads/documents');

// ─── HELPER: Procesar archivos subidos ───
function processUploadedFiles(req) {
  const files = req.files || [];
  const result = {
    featuredImage: null,
    images: [],
    documents: [],
  };

  const docNames = {};
  const docIsPublic = {};
  Object.keys(req.body).forEach(key => {
    const matchName = key.match(/documents\[(\d+)\]\[name\]/);
    if (matchName) {
      const idx = parseInt(matchName[1]);
      docNames[idx] = req.body[key];
    }
    const matchPublic = key.match(/documents\[(\d+)\]\[isPublic\]/);
    if (matchPublic) {
      const idx = parseInt(matchPublic[1]);
      docIsPublic[idx] = req.body[key] === 'true';
    }
  });

  files.forEach(file => {
    if (file.fieldname === 'featuredImage') {
      result.featuredImage = file;
    } else if (file.fieldname === 'images') {
      result.images.push(file);
    } else if (file.fieldname && file.fieldname.startsWith('documents[')) {
      const match = file.fieldname.match(/documents\[(\d+)\]\[file\]/);
      if (match) {
        const idx = parseInt(match[1]);
        result.documents.push({
          file: file,
          name: docNames[idx] || file.originalname,
          isPublic: docIsPublic[idx] || false,
        });
      }
    }
  });

  result.documents.sort((a, b) => {
    const aIdx = parseInt(a.file.fieldname.match(/documents\[(\d+)\]/)[1]);
    const bIdx = parseInt(b.file.fieldname.match(/documents\[(\d+)\]/)[1]);
    return aIdx - bIdx;
  });

  return result;
}

// ─── GET ALL ACTIONS ───
exports.getAllActions = async (req, res) => {
  try {
    const { campaignId, bdsId } = req.query;
    let where = {};
    const parsedCampaignId = toInt(campaignId);
    const parsedBdsId = toInt(bdsId);

    if (req.user) {
      if (req.user.role === 'campaign_admin') {
        const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
        const campaignIds = userCampaigns.map(uc => uc.campaignId);
        if (campaignIds.length === 0) return res.json([]);
        where.campaignId = campaignIds;
      } else if (req.user.role === 'bds_admin') {
        const userBDS = await UserBDS.findAll({ where: { userId: req.user.id } });
        const bdsIds = userBDS.map(ub => ub.bdsId);
        if (bdsIds.length === 0) return res.json([]);
        where.bdsId = bdsIds;
      } else if (req.user.role === 'action_admin') {
        const userActions = await UserAction.findAll({ where: { userId: req.user.id } });
        const actionIds = userActions.map(ua => ua.actionId);
        if (actionIds.length === 0) return res.json([]);
        where.id = actionIds;
      }
    }

    if (parsedCampaignId) where.campaignId = parsedCampaignId;
    if (parsedBdsId) where.bdsId = parsedBdsId;

    // ✅ Sanitización de paginación (una sola vez)
    let { limit, offset } = req.query;
    limit = parseInt(limit) || 20;
    offset = parseInt(offset) || 0;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    if (offset < 0) offset = 0;

    const actions = await Action.findAll({
      where,
      limit,
      offset,
      order: [['datetime', 'DESC']],
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] },
        { model: BDS, as: 'bds', attributes: ['id', 'name', 'color'] },
        { model: ActionImage, as: 'images', attributes: ['id', 'url', 'order'] },
      ],
    });
    res.json(actions);
  } catch (error) {
    console.error('Error en getAllActions:', error);
    res.status(500).json({ message: 'Error al obtener acciones' });
  }
};

// ─── GET ACTION BY ID ───
exports.getActionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const action = await Action.findByPk(id, {
      include: [
        { model: Campaign, as: 'campaign', attributes: ['id', 'name', 'color'] },
        { model: BDS, as: 'bds', attributes: ['id', 'name', 'color'] },
        { model: ActionImage, as: 'images', attributes: ['id', 'url', 'order'] },
      ],
    });
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });
    res.json(action);
  } catch (error) {
    console.error('Error en getActionById:', error);
    res.status(500).json({ message: 'Error al obtener acción' });
  }
};

// ─── CREATE ACTION ───
exports.createAction = async (req, res) => {
  try {
    let {
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive, campaignId, bdsId,
      groups, documentLink,
    } = req.body;

    const parsedCampaignId = toInt(campaignId);
    const parsedBdsId = toInt(bdsId);

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
    } else if (req.user.role === 'bds_admin') {
      const userBDS = await UserBDS.findAll({ where: { userId: req.user.id } });
      const allowedBdsIds = userBDS.map(ub => ub.bdsId);
      if (!parsedBdsId || !allowedBdsIds.includes(parsedBdsId)) {
        return res.status(403).json({ message: 'Debes seleccionar una campaña BDS de las que administras' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para crear acciones' });
    }

    if (parsedBdsId) {
      const bdsExists = await BDS.findByPk(parsedBdsId);
      if (!bdsExists) return res.status(400).json({ message: 'La Campaña BDS indicada no existe' });
    }

    if (latitude !== undefined && latitude !== null && latitude !== '') {
      latitude = parseFloat(latitude);
      if (isNaN(latitude)) latitude = null;
    } else latitude = null;
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      longitude = parseFloat(longitude);
      if (isNaN(longitude)) longitude = null;
    } else longitude = null;

    const uploaded = processUploadedFiles(req);

    let featuredImage = null;
    if (uploaded.featuredImage) {
      featuredImage = `/uploads/featured/${uploaded.featuredImage.filename}`;
    }

    let documentPath = null;
    const publicDoc = uploaded.documents.find(d => d.isPublic === true);
    if (publicDoc) {
      documentPath = `/uploads/documents/${publicDoc.file.filename}`;
    }

    const action = await Action.create({
      title,
      description: description || '',
      category,
      datetime,
      locationType: locationType || 'presencial',
      onlineLink: onlineLink || '',
      placeName: placeName || '',
      address: address || '',
      latitude,
      longitude,
      registrationLink: registrationLink || '',
      recordingUrl: recordingUrl || '',
      isLive: isLive !== undefined ? isLive : true,
      campaignId: parsedCampaignId,
      bdsId: parsedBdsId,
      featuredImage,
      groups: groups || [],
      documentLink: documentLink || null,
      document: documentPath,
    });

    if (uploaded.images.length > 0) {
      const imagePromises = uploaded.images.map((file, index) => {
        const url = `/uploads/actions/${file.filename}`;
        return ActionImage.create({ url, actionId: action.id, order: index });
      });
      await Promise.all(imagePromises);
    }

    try {
      const campaign = await action.getCampaign().catch(() => null);
      if (campaign) {
        const subscribers = await Subscriber.findAll({ where: { status: 'active' } });
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

    const actionWithImages = await Action.findByPk(action.id, {
      include: [{ model: ActionImage, as: 'images' }],
    });
    res.status(201).json(actionWithImages);
  } catch (error) {
    console.error('Error en createAction:', error);
    res.status(500).json({ message: 'Error al crear acción' });
  }
};

// ─── UPDATE ACTION ───
exports.updateAction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const action = await Action.findByPk(id, {
      include: [{ model: ActionImage, as: 'images' }],
    });
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    let {
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive, campaignId, bdsId,
      groups, documentLink,
    } = req.body;

    let parsedCampaignId = toInt(campaignId);
    let parsedBdsId = toInt(bdsId);

    if (req.user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: req.user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (!allowedCampaignIds.includes(action.campaignId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta acción' });
      }
      parsedCampaignId = action.campaignId;
    } else if (req.user.role === 'bds_admin') {
      const userBDS = await UserBDS.findAll({ where: { userId: req.user.id } });
      const allowedBdsIds = userBDS.map(ub => ub.bdsId);
      if (!allowedBdsIds.includes(action.bdsId)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta acción' });
      }
      parsedBdsId = action.bdsId;
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

    if (parsedBdsId && parsedBdsId !== action.bdsId && req.user.role === 'superadmin') {
      const bdsExists = await BDS.findByPk(parsedBdsId);
      if (!bdsExists) return res.status(400).json({ message: 'La Campaña BDS indicada no existe' });
    } else if (parsedBdsId && parsedBdsId !== action.bdsId && req.user.role !== 'superadmin') {
      parsedBdsId = action.bdsId;
    }

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

    const uploaded = processUploadedFiles(req);

    let featuredImage = action.featuredImage;
    if (uploaded.featuredImage) {
      if (action.featuredImage) {
        deleteFileSafe(action.featuredImage, FEATURED_BASE);
      }
      featuredImage = `/uploads/featured/${uploaded.featuredImage.filename}`;
    }

    let documentPath = action.document;
    const publicDoc = uploaded.documents.find(d => d.isPublic === true);
    if (publicDoc) {
      if (action.document) {
        deleteFileSafe(action.document, DOCUMENTS_BASE);
      }
      documentPath = `/uploads/documents/${publicDoc.file.filename}`;
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
      bdsId: parsedBdsId,
      featuredImage,
      groups: groups || [],
      documentLink: documentLink !== undefined ? documentLink : action.documentLink,
      document: documentPath,
    });

    if (uploaded.images.length > 0) {
      const currentImageCount = action.images ? action.images.length : 0;
      const imagePromises = uploaded.images.map((file, index) => {
        const url = `/uploads/actions/${file.filename}`;
        return ActionImage.create({ url, actionId: action.id, order: currentImageCount + index });
      });
      await Promise.all(imagePromises);
    }

    const updatedAction = await Action.findByPk(action.id, {
      include: [{ model: ActionImage, as: 'images' }],
    });
    res.json(updatedAction);
  } catch (error) {
    console.error('Error en updateAction:', error);
    res.status(500).json({ message: 'Error al actualizar acción' });
  }
};

// ─── DELETE ACTION ───
exports.deleteAction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const action = await Action.findByPk(id, {
      include: [{ model: ActionImage, as: 'images' }],
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

// ─── DELETE ACTION IMAGE ───
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