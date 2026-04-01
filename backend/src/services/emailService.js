const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// Configuración del transporte
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Función auxiliar para enlaces
const getUnsubscribeLink = (email) => `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
const getPreferencesLink = (email) => `${process.env.FRONTEND_URL}/preferences?email=${encodeURIComponent(email)}`;

// Helper de Handlebars para formato de fecha
handlebars.registerHelper('formatDate', function(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('es-ES');
});

// Cargar plantillas de forma asíncrona y cachearlas
let templates = {};
async function loadTemplates() {
  const templateNames = ['welcome', 'goodbye', 'campaign', 'action', 'reminder'];
  const templatesDir = path.join(__dirname, '../templates/emails');
  for (const name of templateNames) {
    try {
      const content = await fs.readFile(path.join(templatesDir, `${name}.hbs`), 'utf8');
      templates[name] = handlebars.compile(content);
    } catch (err) {
      console.error(`⚠️ Plantilla ${name}.hbs no encontrada, se usará texto plano.`);
      // Plantilla de respaldo (texto simple)
      templates[name] = (context) => `Contenido de email: ${JSON.stringify(context)}`;
    }
  }
}
loadTemplates().catch(console.error);

const sendEmail = async (to, subject, templateName, context = {}) => {
  const html = templates[templateName] ? templates[templateName]({
    ...context,
    unsubscribeLink: getUnsubscribeLink(to),
    preferencesLink: getPreferencesLink(to),
  }) : `No se pudo generar el HTML para ${templateName}.`;
  await transporter.sendMail({
    from: `"LunaRoja" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};

// Funciones específicas
const sendWelcomeEmail = (email) => sendEmail(email, '¡Bienvenido a LunaRoja!', 'welcome', { username: email.split('@')[0] });
const sendGoodbyeEmail = (email) => sendEmail(email, 'LunaRoja – Lamentamos que te vayas', 'goodbye', {});
const sendCampaignNotification = (email, campaign) => sendEmail(email, `Nueva campaña: ${campaign.name}`, 'campaign', { campaign });
const sendActionNotification = (email, action, campaign) => sendEmail(email, `Nueva acción: ${action.title}`, 'action', { action, campaign });
const sendReminderEmail = (email, action, campaign) => sendEmail(email, `Recordatorio: ${action.title} es mañana`, 'reminder', { action, campaign });

module.exports = {
  sendWelcomeEmail,
  sendGoodbyeEmail,
  sendCampaignNotification,
  sendActionNotification,
  sendReminderEmail,
};