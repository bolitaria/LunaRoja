const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

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
    port: Number(process.env.EMAIL_PORT),
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
  const templateNames = ['welcome', 'goodbye', 'campaign', 'action', 'reminder', 'passwordReset', 'donation_available'];
  const templatesDir = path.join(__dirname, '../templates/emails');

  for (const name of templateNames) {
    try {
      const content = await fs.readFile(path.join(templatesDir, `${name}.hbs`), 'utf8');
      templates[name] = handlebars.compile(content);
    } catch (err) {
      console.error(`⚠️ Template ${name}.hbs not found, using fallback.`);
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

  if (templateName === 'custom' && context.body) {
    if (!transporter) {
      console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Template: custom`);
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
    } catch (err) {
      console.error(`❌ Failed to send email to ${to}:`, err);
    }
    return;
  }

  const data = {
    ...context,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    unsubscribeLink: getUnsubscribeLink(to),
    preferencesLink: getPreferencesLink(to),
    currentYear: new Date().getFullYear(),
  };

  let html;
  try {
    html = templates[templateName] ? templates[templateName](data) : `Plantilla '${templateName}' no encontrada.`;
  } catch (err) {
    console.error(`Error al renderizar plantilla ${templateName}:`, err);
    html = `Error al generar el contenido del email.`;
  }

  if (!transporter) {
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Template: ${templateName}`);
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

const sendDonationAvailableEmail = (email) =>
  sendEmail(email, '🍉 ¡Ya puedes donar!', 'donation_available', {
    username: email.split('@')[0],
    donationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/donaciones`
  });

// ------------------------------------------------------------
// TRANSPORTE BREVO Y FUNCIONES PARA PETICIONES
// ------------------------------------------------------------
const petitionTransporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

async function sendPetitionAlert(petition, signerData) {
  if (!petition.target_emails || !petition.target_emails.length) return;

  const subject = `Nueva firma en "${petition.title}"`;
  let dataRows = '';
  for (const [label, value] of Object.entries(signerData)) {
    dataRows += `<tr><td style="padding:4px 8px;border:1px solid #ddd;"><strong>${label}</strong></td><td style="padding:4px 8px;border:1px solid #ddd;">${value}</td></tr>`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2>Alguien ha firmado tu petición</h2>
      <table style="border-collapse:collapse;width:100%;margin-bottom:16px;">${dataRows}</table>
      <p>Total de firmas hasta ahora: <strong>${petition.total_signatures}</strong></p>
      <hr><a href="${process.env.FRONTEND_URL}/petition/${petition.id}">Ver petición</a>
    </div>`;

  try {
    await petitionTransporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,
      to: petition.target_emails.join(','),
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    if (error.message && error.message.includes('quota')) {
      console.warn('⚠️ Cuota diaria de Brevo alcanzada');
      return { success: false, quotaExceeded: true };
    }
    console.error('❌ Error enviando alerta de petición:', error);
    return { success: false, quotaExceeded: false };
  }
}

module.exports = {
  initEmailService,
  sendEmail,
  sendWelcomeEmail,
  sendGoodbyeEmail,
  sendCampaignNotification,
  sendActionNotification,
  sendReminderEmail,
  sendPasswordResetEmail,
  sendCustomEmail,
  sendDonationAvailableEmail,
  sendPetitionAlert,
};
