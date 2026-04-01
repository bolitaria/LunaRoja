const Subscriber = require('../models/Subscriber');
const SubscribersReminder = require('../models/SubscribersReminder');
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../services/emailService');

// Obtener todos los suscriptores (admin)
const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.findAll({ order: [['subscribedAt', 'DESC']] });
    res.json(subscribers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener suscriptores' });
  }
};

// Crear un nuevo suscriptor (público)
const createSubscriber = async (req, res) => {
  try {
    const { email, sendReminders = false } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email es requerido' });
    }

    // Verificar si ya existe
    const existing = await Subscriber.findOne({ where: { email } });
    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Reactivar
        await existing.update({ status: 'active', sendReminders });
        await sendWelcomeEmail(email);
        return res.json({ message: 'Suscripción reactivada', subscriber: existing });
      }
      return res.status(400).json({ message: 'Este email ya está suscrito' });
    }

    const subscriber = await Subscriber.create({ email, sendReminders });
    await sendWelcomeEmail(email);
    res.status(201).json({ message: 'Suscripción exitosa', subscriber });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear suscriptor' });
  }
};

// Desuscribir (público)
const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    const subscriber = await Subscriber.findOne({ where: { email } });
    if (!subscriber) {
      return res.status(404).json({ message: 'Email no encontrado' });
    }

    await subscriber.update({ status: 'unsubscribed' });
    await sendGoodbyeEmail(email);
    res.json({ message: 'Desuscripción exitosa' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al desuscribir' });
  }
};

// Eliminar suscriptor (admin)
const deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Subscriber.findByPk(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: 'Suscriptor no encontrado' });
    }

    await subscriber.destroy();
    res.json({ message: 'Suscriptor eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar suscriptor' });
  }
};

// Actualizar preferencias (opcional)
const updatePreferences = async (req, res) => {
  try {
    const { email, sendReminders } = req.body;
    const subscriber = await Subscriber.findOne({ where: { email } });
    if (!subscriber) {
      return res.status(404).json({ message: 'Suscriptor no encontrado' });
    }
    await subscriber.update({ sendReminders });
    res.json({ message: 'Preferencias actualizadas', subscriber });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar preferencias' });
  }
};

module.exports = {
  getAllSubscribers,
  createSubscriber,
  unsubscribe,
  deleteSubscriber,
  updatePreferences,
};