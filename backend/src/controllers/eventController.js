const Event = require('../models/Event');

// GET /api/events (público) - opcional filtro por fecha (próximos/pasados)
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.findAll({ order: [['datetime', 'DESC']] });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener eventos' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener evento' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const {
      title, description, type, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive
    } = req.body;

    if (!title || !datetime) {
      return res.status(400).json({ message: 'Título y fecha/hora son requeridos' });
    }

    const event = await Event.create({
      title, description, type, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive
    });
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear evento' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });

    const {
      title, description, type, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive
    } = req.body;

    await event.update({
      title, description, type, datetime,
      locationType, onlineLink, placeName, address, latitude, longitude,
      registrationLink, recordingUrl, isLive
    });
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar evento' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });

    await event.destroy();
    res.json({ message: 'Evento eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar evento' });
  }
};