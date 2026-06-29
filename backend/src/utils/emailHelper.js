const EmailTemplate = require('../models/EmailTemplate');
const Subscriber = require('../models/Subscriber');
const { sendCustomEmail } = require('../services/emailService');

const getUnsubscribeLink = (email) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
};

const getPreferencesLink = (email) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/preferences?email=${encodeURIComponent(email)}`;
};

/**
 * Intenta enviar una notificación a todos los suscriptores activos usando la plantilla
 * asociada al evento indicado. Si no hay plantilla o está inactiva, devuelve false.
 *
 * @param {string} event - Nombre del evento asociado (campaign_created, action_created, etc.)
 * @param {object} context - Variables para reemplazar en la plantilla (campaign, action, etc.)
 * @returns {Promise<boolean>}
 */
const sendNotificationToSubscribers = async (event, context) => {
  const template = await EmailTemplate.findOne({
    where: { associatedEvent: event, isActive: true },
  });
  if (!template) return false;

  const subscribers = await Subscriber.findAll({ where: { status: 'active' } });
  if (subscribers.length === 0) return true;

  for (const sub of subscribers) {
    let html = template.body;
    html = html.replace('{{unsubscribeLink}}', getUnsubscribeLink(sub.email));
    html = html.replace('{{preferencesLink}}', getPreferencesLink(sub.email));
    html = html.replace('{{subscriber.email}}', sub.email);

    if (context.campaign) {
      html = html.replace('{{campaign.name}}', context.campaign.name || '');
      html = html.replace('{{campaign.description}}', context.campaign.description || '');
      html = html.replace('{{campaign.color}}', context.campaign.color || '');
      if (context.campaign.url) html = html.replace('{{campaign.url}}', context.campaign.url || '');
    }
    if (context.action) {
      html = html.replace('{{action.title}}', context.action.title || '');
      html = html.replace('{{action.description}}', context.action.description || '');
      html = html.replace('{{action.datetime}}', context.action.datetime
        ? new Date(context.action.datetime).toLocaleString('es-ES')
        : '');
      html = html.replace('{{action.registrationLink}}', context.action.registrationLink || '');
    }

    await sendCustomEmail(sub.email, template.subject, html)
      .catch(err => console.error(`Error enviando a ${sub.email}:`, err));
  }
  return true;
};

module.exports = { sendNotificationToSubscribers };