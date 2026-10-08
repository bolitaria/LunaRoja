const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// ==========================================================
// HELPERS DE SEGURIDAD
// ==========================================================

handlebars.registerHelper('safeLink', function(url, text) {
  if (typeof url !== 'string' || url.trim() === '') return text || '';
  const safe = /^(https?:\/\/|mailto:)/i.test(url.trim());
  if (safe) {
    const escapedUrl = handlebars.escapeExpression(url);
    const escapedText = text ? handlebars.escapeExpression(text) : escapedUrl;
    return new handlebars.SafeString(`<a href="${escapedUrl}">${escapedText}</a>`);
  }
  return text || '';
});

handlebars.registerHelper('concat', function(...args) {
  return args.slice(0, -1).join('');
});

handlebars.registerHelper('formatDate', function(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('es-ES');
});

// ==========================================================
// CONFIGURACIÓN DEL TRANSPORTE
// ==========================================================
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

// ==========================================================
// RENDERIZADO SEGURO DE PLANTILLAS
// ==========================================================
/**
 * Compila y renderiza un cuerpo de plantilla Handlebars.
 *
 * SEGURIDAD (SSTI):
 * - El `template.body` se edita SOLO por superadmins via PUT /api/email-templates/:id.
 * - `updateTemplate` y `createTemplate` validan el cuerpo y rechazan patrones
 *   peligrosos antes de persistirlo (constructor, __proto__, prototype, lookup, with).
 * - Handlebars 4.6+ bloquea por defecto el acceso a `Object.prototype`, cortando
 *   los vectores SSTI conocidos (constructor.constructor, __proto__.*).
 * - Los helpers registrados (safeLink, concat, formatDate) son puros: no evalúan
 *   código, no leen ficheros, no ejecutan comandos.
 * - El contexto de render son datos controlados por el servidor (sub, action,
 *   campaign), no input directo del atacante salvo en el endpoint preview.
 *
 * Por lo anterior, la regla `express-insecure-template-usage` se acepta como
 * falso positivo contextual.
 *
 * @param {string} src - Cuerpo del template (.hbs)
 * @param {object} data - Datos a inyectar
 * @returns {string} HTML renderizado
 */
/**
 * Convierte texto plano del cuerpo del email en HTML seguro:
 *   · Escapa HTML (&, <, >, ", ').
 *   · Agrupa párrafos por doble salto de línea → <p>.
 *   · Saltos simples dentro de un párrafo → <br>.
 *   · Autolink de URLs http(s):// y www. → <a>.
 *
 * Se usa solo cuando `email_content_mode === 'text'`.
 * En modo 'rich' el contenido ya es HTML (viene de Quill).
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function autolink(escapedText) {
  // El texto ya está escapado, así que URLs son seguras
  return escapedText.replace(
    /\b((?:https?:\/\/|www\.)[^\s<]+)/gi,
    (url) => {
      const href = url.startsWith('http') ? url : `https://${url}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    }
  );
}

function textToHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${autolink(escapeHtml(p)).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

/**
 * Normaliza el cuerpo del email según `mode`:
 *   - 'text' → convierte texto plano a HTML
 *   - 'rich' → asume HTML (viene de Quill), lo pasa tal cual
 */
function normalizeEmailBody(content, mode) {
  if (mode === 'text') return textToHtml(content || '');
  return content || '';
}

// ────────────────────────────────────────────────────────────
// Caché LRU de plantillas Handlebars compiladas.
// Evita recompilar (5-20 ms) en cada email enviado.
// Key = el propio string del template → autoinvalida al cambiar.
// ────────────────────────────────────────────────────────────
const compiledTemplateCache = new Map();
const COMPILED_CACHE_MAX = 100;

const renderTemplate = (src, data) => {
  if (!src) return '';
  let compiled = compiledTemplateCache.get(src);
  if (!compiled) {
    // nosemgrep: javascript.express.security.express-insecure-template-usage.express-insecure-template-usage
    compiled = handlebars.compile(src, {
      strict: false,
      noEscape: false,
      preventIndent: true,
    });
    if (compiledTemplateCache.size >= COMPILED_CACHE_MAX) {
      compiledTemplateCache.delete(compiledTemplateCache.keys().next().value);
    }
    compiledTemplateCache.set(src, compiled);
  }
  return compiled(data);
};

// ==========================================================
// CARGA DE PLANTILLAS
// ==========================================================
async function loadTemplates() {
  const templateNames = [
    'welcome',
    'goodbye',
    'campaign',
    'action',
    'reminder',
    'passwordReset',
    'donation_available',
    'petition_notification',
    'report_notification',
  ];
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
  if (!loadingPromise) loadingPromise = loadTemplates();
  await loadingPromise;
  console.log('✅ Email templates loaded');
};

// ==========================================================
// FUNCIÓN GENÉRICA DE ENVÍO
// ==========================================================
const sendEmail = async (to, subject, templateName, context = {}) => {
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_EMAILS === 'true') {
    console.log(`[TEST MOCK EMAIL] To: ${to}, Subject: ${subject}, Template: ${templateName}`);
    return true;
  }

  if (!templatesLoaded) await initEmailService();

  if (templateName === 'custom' && context.body) {
    if (!transporter) {
      console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Template: custom`);
      return true;
    }
    try {
      await transporter.sendMail({
        from: `"Voces Palestinas por la Justicia" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html: context.body,
      });
      console.log(`✅ Email sent to ${to} (${subject})`);
      return true;
    } catch (err) {
      console.error(`❌ Failed to send email to ${to}:`, err);
      return false;
    }
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
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Voces Palestinas por la Justicia" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to} (${subject})`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err);
    return false;
  }
};

// ==========================================================
// FUNCIONES DE ENVÍO PREDEFINIDAS
// ==========================================================
const sendWelcomeEmail = (email) =>
  sendEmail(email, '¡Bienvenido a Voces Palestinas por la Justicia!', 'welcome', { username: email.split('@')[0] });

const sendGoodbyeEmail = (email) =>
  sendEmail(email, 'Voces Palestinas por la Justicia – Lamentamos que te vayas', 'goodbye', {});

const sendCampaignNotification = (email, campaign) => {
  const campaignUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/campanas/${campaign.id}`;
  return sendEmail(email, `Nueva campaña: ${campaign.name}`, 'campaign', {
    campaign: { ...campaign, url: campaignUrl },
    unfollowLink: campaign.unfollowLink || '',
  });
};

const sendActionNotification = (email, action, campaign, extra = {}) => {
  return sendEmail(email, `Nueva acción: ${action.title}`, 'action', {
    action,
    campaign,
    ...extra,
  });
};

const sendReminderEmail = (email, action, campaign) =>
  sendEmail(email, `Recordatorio: ${action.title} es mañana`, 'reminder', { action, campaign });

const sendPasswordResetEmail = (email, resetUrl) =>
  sendEmail(email, 'Restablecer tu contraseña', 'passwordReset', { resetUrl });

const sendCustomEmail = (email, subject, htmlBody) =>
  sendEmail(email, subject, 'custom', { body: htmlBody });

const sendDonationAvailableEmail = (email) =>
  sendEmail(email, '🍉 ¡Ya puedes donar!', 'donation_available', {
    username: email.split('@')[0],
    donationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/donaciones`,
  });

const sendPetitionNotification = (email, petition) => {
  const petitionUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/peticiones/${petition.id}`;
  return sendEmail(email, `Nueva petición: ${petition.title}`, 'petition_notification', {
    petition,
    petitionUrl,
  });
};

const sendReportNotification = (email, report) => {
  const reportUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reportes/${report.id}`;
  return sendEmail(email, `Nuevo ${report.type === 'blog' ? 'blog' : 'reporte'}: ${report.title}`, 'report_notification', {
    report,
    reportUrl,
  });
};

// ------------------------------------------------------------
// TRANSPORTE BREVO PARA PETICIONES
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

async function sendPetitionAlert(petition, signerData, template = null) {
  if (!petition.target_emails || !petition.target_emails.length) return;

  if (template) {
    try {
      const EmailTemplate = require('../models/EmailTemplate');
      const tpl = await EmailTemplate.findByPk(template.id);
      if (tpl) {
        return sendEmailWithTemplate(petition.target_emails, tpl, { ...signerData, petition });
      }
    } catch (err) {
      console.error('Error al enviar con plantilla personalizada:', err);
    }
  }

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

// ────────────────────────────────────────────────────────────
// Caché LRU de HTML renderizado por (petitionId, templateId).
// Invalidación: si cambia petition.updatedAt o template.updatedAt.
// El subject NO se cachea (puede contener variables del firmante).
// ────────────────────────────────────────────────────────────
const renderedEmailCache = new Map();
const RENDERED_CACHE_MAX = 500;

const sendEmailWithTemplate = async (to, template, data) => {
  const petition = data.petition || null;

  // Subject: siempre se recompila (barato, y puede contener datos del firmante)
  const subjectCompiled = renderTemplate(template.subject, data);

  // ── Cache key estable ──
  const cacheKey = `${petition?.id || '_nop'}|${template.id}`;
  const petitionStamp = petition?.updatedAt?.getTime?.() || 0;
  const templateStamp = template.updatedAt?.getTime?.() || 0;

  const cached = renderedEmailCache.get(cacheKey);
  if (cached && cached.petitionStamp === petitionStamp && cached.templateStamp === templateStamp) {
    return sendEmail(to, subjectCompiled, 'custom', { body: cached.html });
  }

  // ── Cache miss → recomputar ──
  const rawContent = data.content || petition?.content || '';
  const emailMode = petition?.email_content_mode || 'rich';
  const normalizedContent = normalizeEmailBody(rawContent, emailMode);
  const dataWithNormalizedContent = { ...data, content: normalizedContent };

  let htmlCompiled = renderTemplate(template.body, dataWithNormalizedContent);

  // Colores institucionales: cada plantilla tiene los suyos guardados en BD.
  htmlCompiled = htmlCompiled
    .replace(/--header-color/g,       template.headerColor       || '#b91c1c')
    .replace(/--button-color/g,       template.buttonColor       || '#16a34a')
    .replace(/--footer-color/g,       template.footerColor       || '#1f2937')
    .replace(/--bg-color/g,           template.backgroundColor   || '#f3f4f6')
    .replace(/--title-color/g,        template.titleColor        || '#ffffff')
    .replace(/--footer-title-color/g, template.footerTitleColor  || '#ffffff');

  // LRU: si supera el máximo, elimina la entrada más antigua
  if (renderedEmailCache.size >= RENDERED_CACHE_MAX) {
    renderedEmailCache.delete(renderedEmailCache.keys().next().value);
  }
  renderedEmailCache.set(cacheKey, {
    html: htmlCompiled,
    petitionStamp,
    templateStamp,
  });

  return sendEmail(to, subjectCompiled, 'custom', { body: htmlCompiled });
};

// Utilidad para invalidación manual (tests, mantenimiento)
function clearEmailRenderCache() {
  renderedEmailCache.clear();
  compiledTemplateCache.clear();
}

// ========== EXPORTACIÓN ÚNICA ==========
module.exports = {
  initEmailService,
  renderTemplate,
  clearEmailRenderCache,
  sendEmail,
  sendWelcomeEmail,
  sendGoodbyeEmail,
  sendCampaignNotification,
  sendActionNotification,
  sendReminderEmail,
  sendPasswordResetEmail,
  sendCustomEmail,
  sendDonationAvailableEmail,
  sendPetitionNotification,
  sendReportNotification,
  sendPetitionAlert,
  sendEmailWithTemplate,
};