const Action = require('../models/Action');

exports.getAllActions = async (req, res) => {
  try {
    const { campaignId } = req.query;
    const where = {};
    if (campaignId) where.campaignId = campaignId;
    const actions = await Action.findAll({ where, order: [['datetime', 'DESC']] });
    res.json(actions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener acciones' });
  }
};

exports.getActionById = async (req, res) => {
  try {
    const action = await Action.findByPk(req.params.id);
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

    const action = await Action.create({
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive,
      campaignId: campaignId || null
    });
    res.status(201).json(action);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear acción', error: error.message });
  }
};

exports.updateAction = async (req, res) => {
  try {
    const action = await Action.findByPk(req.params.id);
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    let {
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive, campaignId
    } = req.body;

    if (!latitude && latitude !== 0) latitude = null;
    if (!longitude && longitude !== 0) longitude = null;
    if (latitude !== null && !isNaN(parseFloat(latitude))) latitude = parseFloat(latitude);
    if (longitude !== null && !isNaN(parseFloat(longitude))) longitude = parseFloat(longitude);

    await action.update({
      title, description, category, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive, campaignId
    });
    res.json(action);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar acción' });
  }
};

exports.deleteAction = async (req, res) => {
  try {
    const action = await Action.findByPk(req.params.id);
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });
    await action.destroy();
    res.json({ message: 'Acción eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar acción' });
  }
};