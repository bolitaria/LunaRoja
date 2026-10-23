const cron = require('node-cron');
const { Op } = require('sequelize');
const SubscribersReminder = require('../models/SubscribersReminder');
const Action = require('../models/Action');
const Campaign = require('../models/Campaign');
const Subscriber = require('../models/Subscriber');
const { sendReminderEmail } = require('../services/emailService');

async function runReminderJob() {
  console.log('[ReminderJob] Checking pending reminders...');
  const now = new Date();
  const reminders = await SubscribersReminder.findAll({
    where: { scheduledAt: { [Op.lte]: now }, sent: false },
    include: [
      { model: Action, as: 'action', include: [{ model: Campaign, as: 'campaign' }] },
      { model: Subscriber, as: 'subscriber' },
    ],
  });

  for (const reminder of reminders) {
    try {
      await sendReminderEmail(reminder.subscriber.email, reminder.action, reminder.action.campaign);
      reminder.sent = true;
      await reminder.save();
      console.log(`Reminder sent to ${reminder.subscriber.email} for action ${reminder.action.title}`);
    } catch (error) {
      console.error(`Failed to send reminder to ${reminder.subscriber.email}:`, error);
    }
  }
}

let job = null;

function startReminderJob() {
  if (job) return job;
  job = cron.schedule('*/10 * * * *', runReminderJob);
  console.log('[ReminderJob] scheduler started');
  return job;
}

function stopReminderJob() {
  if (!job) return;
  job.stop();
  job = null;
  console.log('[ReminderJob] scheduler stopped');
}

module.exports = { startReminderJob, stopReminderJob, runReminderJob };
