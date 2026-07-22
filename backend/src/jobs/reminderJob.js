const cron = require('node-cron');
const { Op } = require('sequelize');
const SubscribersReminder = require('../models/SubscribersReminder');
const Action = require('../models/Action');
const Campaign = require('../models/Campaign');
const Subscriber = require('../models/Subscriber');
const { sendReminderEmail } = require('../services/emailService');

// Ejecutar cada 10 minutos (ajusta la frecuencia si lo deseas)
cron.schedule('*/10 * * * *', async () => {
  console.log('[ReminderJob] Checking pending reminders...');
  const now = new Date();

  const reminders = await SubscribersReminder.findAll({
    where: {
      scheduledAt: { [Op.lte]: now },
      sent: false,
    },
    include: [
      {
        model: Action,
        as: 'action',
        include: [{ model: Campaign, as: 'campaign' }], // asociación explícita
      },
      {
        model: Subscriber,
        as: 'subscriber',
      },
    ],
  });

  for (const reminder of reminders) {
    try {
      await sendReminderEmail(
        reminder.subscriber.email,
        reminder.action,
        reminder.action.campaign
      );
      reminder.sent = true;
      await reminder.save();
      console.log(`Reminder sent to ${reminder.subscriber.email} for action ${reminder.action.title}`);
    } catch (error) {
      console.error(`Failed to send reminder to ${reminder.subscriber.email}:`, error);
      // Opcional: incrementar contador de reintentos
    }
  }
});