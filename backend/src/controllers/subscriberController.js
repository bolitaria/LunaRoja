const Subscriber = require('../models/Subscriber');
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../services/emailService');

const isValidEmail = (email) => /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email);

const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.findAll({ order: [['subscribedAt', 'DESC']] });
    res.json(subscribers);
  } catch (error) {
    console.error('getAllSubscribers error:', error);
    res.status(500).json({ message: 'Error retrieving subscribers' });
  }
};

const createSubscriber = async (req, res) => {
  try {
    const { email, sendReminders = false } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email format' });

    const existing = await Subscriber.findOne({ where: { email } });
    if (existing) {
      if (existing.status === 'unsubscribed') {
        await existing.update({ status: 'active', sendReminders });
        sendWelcomeEmail(email).catch(err => console.error('Welcome email error (reactivation):', err));
        return res.json({ message: 'Subscription reactivated', subscriber: existing });
      } else {
        return res.status(400).json({ message: 'This email is already subscribed' });
      }
    }

    const subscribedAt = new Date();
    const subscriber = await Subscriber.create({
      email,
      sendReminders,
      status: 'active',
      subscribedAt,
    });

    sendWelcomeEmail(email).catch(err => console.error('Welcome email error:', err));
    res.status(201).json({ message: 'Subscription successful', subscriber });
  } catch (error) {
    console.error('createSubscriber error:', error);
    res.status(500).json({ message: 'Error creating subscriber' });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) return res.status(400).json({ message: 'Valid email is required' });

    const subscriber = await Subscriber.findOne({ where: { email } });
    if (!subscriber) return res.status(404).json({ message: 'Email not found' });

    await subscriber.update({ status: 'unsubscribed' });
    sendGoodbyeEmail(email).catch(err => console.error('Goodbye email error:', err));
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('unsubscribe error:', error);
    res.status(500).json({ message: 'Error unsubscribing' });
  }
};

const deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Subscriber.findByPk(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    await subscriber.destroy();
    res.json({ message: 'Subscriber deleted successfully' });
  } catch (error) {
    console.error('deleteSubscriber error:', error);
    res.status(500).json({ message: 'Error deleting subscriber' });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const { email, sendReminders } = req.body;
    if (!email || !isValidEmail(email)) return res.status(400).json({ message: 'Valid email is required' });

    const subscriber = await Subscriber.findOne({ where: { email } });
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    await subscriber.update({ sendReminders });
    res.json({ message: 'Preferences updated', subscriber });
  } catch (error) {
    console.error('updatePreferences error:', error);
    res.status(500).json({ message: 'Error updating preferences' });
  }
};

module.exports = {
  getAllSubscribers,
  createSubscriber,
  unsubscribe,
  deleteSubscriber,
  updatePreferences,
};