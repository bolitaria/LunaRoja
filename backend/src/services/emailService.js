const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// ---------- Configuration ----------
let transporter = null;
let templates = {};
let templatesLoaded = false;
let loadingPromise = null;

const isEmailConfigured = () => {
  return process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_FROM;
};

if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  console.warn('⚠️ Email service not configured. Emails will be logged to console.');
}

const getUnsubscribeLink = (email) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
};
const getPreferencesLink = (email) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/preferences?email=${encodeURIComponent(email)}`;
};

handlebars.registerHelper('formatDate', function(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('es-ES');
});

async function loadTemplates() {
  const templateNames = ['welcome', 'goodbye', 'campaign', 'action', 'reminder', 'passwordReset'];
  const templatesDir = path.join(__dirname, '../templates/emails');

  for (const name of templateNames) {
    try {
      const content = await fs.readFile(path.join(templatesDir, `${name}.hbs`), 'utf8');
      templates[name] = handlebars.compile(content);
    } catch (err) {
      console.error(`⚠️ Template ${name}.hbs not found, using plain text fallback.`);
      templates[name] = (context) => `Email content: ${JSON.stringify(context)}`;
    }
  }
  templatesLoaded = true;
}

const initEmailService = async () => {
  if (!loadingPromise) {
    loadingPromise = loadTemplates();
  }
  await loadingPromise;
  console.log('✅ Email templates loaded');
};

const sendEmail = async (to, subject, templateName, context = {}) => {
  if (!templatesLoaded) {
    await initEmailService();
  }

  // Si no es una plantilla predefinida y viene un body HTML directo
  if (templateName === 'custom' && context.body) {
    const data = {
      ...context,
      unsubscribeLink: getUnsubscribeLink(to),
      preferencesLink: getPreferencesLink(to),
    };

    if (!transporter) {
      console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Template: custom`);
      console.log(`[MOCK EMAIL] HTML: ${context.body.substring(0, 200)}...`);
      return;
    }

    try {
      await transporter.sendMail({
        from: `"Voces Palestinas por la Justicia" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html: context.body,
      });
      console.log(`✅ Email sent to ${to} (${subject})`);
      return;
    } catch (err) {
      console.error(`❌ Failed to send email to ${to}:`, err);
      return;
    }
  }

  const data = {
    ...context,
    unsubscribeLink: getUnsubscribeLink(to),
    preferencesLink: getPreferencesLink(to),
  };

  let html;
  try {
    html = templates[templateName] ? templates[templateName](data) : `HTML not available for ${templateName}.`;
  } catch (err) {
    console.error(`Template rendering error for ${templateName}:`, err);
    html = `Error generating email content.`;
  }

  if (!transporter) {
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Template: ${templateName}`);
    console.log(`[MOCK EMAIL] HTML: ${html.substring(0, 200)}...`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Voces Palestinas por la Justicia" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to} (${subject})`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err);
  }
};

const sendWelcomeEmail = (email) =>
  sendEmail(email, '¡Bienvenido a Voces Palestinas por la Justicia!', 'welcome', { username: email.split('@')[0] });

const sendGoodbyeEmail = (email) =>
  sendEmail(email, 'Voces Palestinas por la Justicia – Lamentamos que te vayas', 'goodbye', {});

const sendCampaignNotification = (email, campaign) =>
  sendEmail(email, `Nueva campaña: ${campaign.name}`, 'campaign', { campaign });

const sendActionNotification = (email, action, campaign) =>
  sendEmail(email, `Nueva acción: ${action.title}`, 'action', { action, campaign });

const sendReminderEmail = (email, action, campaign) =>
  sendEmail(email, `Recordatorio: ${action.title} es mañana`, 'reminder', { action, campaign });

const sendPasswordResetEmail = (email, resetUrl) =>
  sendEmail(email, 'Restablecer tu contraseña', 'passwordReset', { resetUrl });

const sendCustomEmail = (email, subject, htmlBody) =>
  sendEmail(email, subject, 'custom', { body: htmlBody });

module.exports = {
  initEmailService,
  sendWelcomeEmail,
  sendGoodbyeEmail,
  sendCampaignNotification,
  sendActionNotification,
  sendReminderEmail,
  sendPasswordResetEmail,
  sendCustomEmail,
};