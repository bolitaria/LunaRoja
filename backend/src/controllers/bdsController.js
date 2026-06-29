const BDS = require('../models/BDS');
const UserBDS = require('../models/UserBDS');
const Subscriber = require('../models/Subscriber');
const Action = require('../models/Action');
const ActionImage = require('../models/ActionImage');
const { sendCampaignNotification } = require('../services/emailService');
const { sendNotificationToSubscribers } = require('../utils/emailHelper'); // ← AÑADIDO
const { toInt, isValidId, deleteFileSafe } = require('../utils/helpers');
const path = require('path');

const BDS_BASE = path.join(__dirname, '../../uploads/bds');
const DOCUMENTS_BASE = path.join(__dirname, '../../uploads/documents');

exports.getAllBDS = async (req, res) => {
  try {
    let where = {};
    if (req.user) {
      if (req.user.role === 'bds_admin') {
        const userBDS = await UserBDS.findAll({ where: { userId: req.user.id } });
        const ids = userBDS.map(u => u.bdsId);
        if (ids.length === 0) return res.json([]);
        where.id = ids;
      } else if (req.user.role === 'action_admin') {
        return res.json([]);
      } else if (req.user.role !== 'superadmin') {
        return res.json([]);
      }
    }
    const bds = await BDS.findAll({ where, order: [['name', 'ASC']] });
    res.json(bds);
  } catch (error) {
    console.error('Error en getAllBDS:', error);
    res.status(500).json({ message: 'Error al obtener BDS' });
  }
};

exports.getBDSById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const bds = await BDS.findByPk(id, {
      include: [{ model: Action, as: 'bdsActions', include: [{ model: ActionImage, as: 'images' }] }],
    });
    if (!bds) return res.status(404).json({ message: 'BDS no encontrada' });
    res.json(bds);
  } catch (error) {
    console.error('Error en getBDSById:', error);
    res.status(500).json({ message: 'Error al obtener BDS' });
  }
};

exports.createBDS = async (req, res) => {
  try {
    let { name, description, color, groups, documentLink } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });
    if (groups && typeof groups === 'string') {
      try { groups = JSON.parse(groups); } catch (e) { groups = null; }
    }
    let imageUrl = null;
    if (req.files && req.files.image && req.files.image.length > 0) {
      imageUrl = `/uploads/bds/${req.files.image[0].filename}`;
    }
    let documentPath = null;
    if (req.files && req.files.document && req.files.document.length > 0) {
      documentPath = `/uploads/documents/${req.files.document[0].filename}`;
    }
    const bds = await BDS.create({
      name, description: description || '', color: color || '#E53E3E',
      imageUrl, groups: groups || [], documentLink: documentLink || null, document: documentPath,
    });

    // ─── NOTIFICACIONES (plantilla + fallback) ─────────────────
    try {
      const sent = await sendNotificationToSubscribers('bds_campaign_created', { campaign: bds });
      if (!sent) {
        // Fallback: método antiguo
        const subscribers = await Subscriber.findAll({ where: { status: 'active' } });
        for (const sub of subscribers) {
          await sendCampaignNotification(sub.email, bds)
            .catch(err => console.error(`Error email a ${sub.email}:`, err));
        }
        console.log(`Notificaciones de BDS enviadas (método antiguo) a ${subscribers.length} suscriptores`);
      } else {
        console.log(`Notificaciones de BDS enviadas usando plantilla 'bds_campaign_created'`);
      }
    } catch (emailError) {
      console.error('Error al enviar notificaciones de BDS:', emailError);
    }
    // ─────────────────────────────────────────────────────────

    res.status(201).json(bds);
  } catch (error) {
    console.error('Error en createBDS:', error);
    res.status(500).json({ message: 'Error al crear BDS' });
  }
};

exports.updateBDS = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const bds = await BDS.findByPk(id);
    if (!bds) return res.status(404).json({ message: 'BDS no encontrada' });
    if (req.user.role === 'bds_admin') {
      const userBDS = await UserBDS.findAll({ where: { userId: req.user.id } });
      const allowedIds = userBDS.map(u => u.bdsId);
      if (!allowedIds.includes(bds.id)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta BDS' });
      }
    } else if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    let { name, description, color, groups, documentLink } = req.body;
    if (groups && typeof groups === 'string') {
      try { groups = JSON.parse(groups); } catch (e) { groups = null; }
    }
    let imageUrl = bds.imageUrl;
    if (req.files && req.files.image && req.files.image.length > 0) {
      if (bds.imageUrl) deleteFileSafe(bds.imageUrl, BDS_BASE);
      imageUrl = `/uploads/bds/${req.files.image[0].filename}`;
    }
    let documentPath = bds.document;
    if (req.files && req.files.document && req.files.document.length > 0) {
      if (bds.document) deleteFileSafe(bds.document, DOCUMENTS_BASE);
      documentPath = `/uploads/documents/${req.files.document[0].filename}`;
    }
    await bds.update({
      name: name || bds.name,
      description: description !== undefined ? description : bds.description,
      color: color || bds.color, imageUrl, groups: groups || [],
      documentLink: documentLink !== undefined ? documentLink : bds.documentLink,
      document: documentPath,
    });
    res.json(bds);
  } catch (error) {
    console.error('Error en updateBDS:', error);
    res.status(500).json({ message: 'Error al actualizar BDS' });
  }
};

exports.deleteBDS = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const bds = await BDS.findByPk(id);
    if (!bds) return res.status(404).json({ message: 'BDS no encontrada' });
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar BDS' });
    }
    if (bds.imageUrl) deleteFileSafe(bds.imageUrl, BDS_BASE);
    if (bds.document) deleteFileSafe(bds.document, DOCUMENTS_BASE);
    await bds.destroy();
    res.json({ message: 'BDS eliminada' });
  } catch (error) {
    console.error('Error en deleteBDS:', error);
    res.status(500).json({ message: 'Error al eliminar BDS' });
  }
};