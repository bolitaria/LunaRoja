const cron = require('node-cron');
const { Op } = require('sequelize');
const SubscribersReminder = require('../models/SubscribersReminder');
const Action = require('../models/Action');
const Subscriber = require('../models/Subscriber');
const { sendReminderEmail } = require('../services/emailService');

// Ejecutar cada 10 minutos
cron.schedule('*/10 * * * *', async () => {
  console.log('[ReminderJob] Comprobando recordatorios pendientes...');
  const now = new Date();
  const reminders = await SubscribersReminder.findAll({
    where: {
      scheduledAt: { [Op.lte]: now },
      sent: false,
    },
    include: [
      { model: Action, as: 'action', include: ['campaign'] },
      { model: Subscriber, as: 'subscriber' },
    ],
  });

  for (const reminder of reminders) {
    try {
      await sendReminderEmail(reminder.subscriber.email, reminder.action, reminder.action.campaign);
      reminder.sent = true;
      await reminder.save();
      console.log(`Recordatorio enviado a ${reminder.subscriber.email} para acción ${reminder.action.title}`);
    } catch (error) {
      console.error(`Error al enviar recordatorio a ${reminder.subscriber.email}:`, error);
    }
  }
});