const fs = require('fs').promises;
const path = require('path');
const EmailTemplate = require('../models/EmailTemplate');
const Subscriber = require('../models/Subscriber');
const { sendEmailWithTemplate } = require('../services/emailService');

// Patrones prohibidos en el cuerpo/asunto de plantillas (defensa en profundidad anti-SSTI).
// Bloquea acceso a prototype/constructor y helpers peligrosos de Handlebars.
// Los helpers propios (safeLink, concat, formatDate) no se ven afectados.
const DANGEROUS_TEMPLATE_PATTERN = /constructor|__proto__|prototype|\{\{#with|\{\{\s*lookup/i;

// Sincroniza plantillas estáticas .hbs a la BD
async function syncStaticTemplates() {
  const templateDir = path.join(__dirname, '../templates/emails');
  const staticTemplates = [
    { name: 'Bienvenida', file: 'welcome.hbs', subject: '¡Bienvenido a Voces Palestinas por la Justicia!', associatedEvent: 'subscriber_welcome', type: 'system' },
    { name: 'Despedida', file: 'goodbye.hbs', subject: 'Lamentamos que te vayas', associatedEvent: 'subscriber_goodbye', type: 'system' },
    { name: 'Notificación de campaña', file: 'campaign.hbs', subject: 'Nueva campaña', associatedEvent: 'campaign_created', type: 'system' },
    { name: 'Notificación de acción', file: 'action.hbs', subject: 'Nueva acción', associatedEvent: 'action_created', type: 'system' },
    { name: 'Recordatorio de acción', file: 'reminder.hbs', subject: 'Recordatorio de acción', associatedEvent: 'reminder', type: 'system' },
    { name: 'Restablecer contraseña', file: 'passwordReset.hbs', subject: 'Restablecer tu contraseña', associatedEvent: 'password_reset', type: 'system' },
    { name: 'Donaciones disponibles', file: 'donation_available.hbs', subject: '¡Ya puedes donar!', associatedEvent: 'donation_available', type: 'system' },
    { name: 'Notificación de petición', file: 'petition_notification.hbs', subject: 'Nueva petición', associatedEvent: 'petition', type: 'system' },
    { name: 'Notificación de reporte', file: 'report_notification.hbs', subject: 'Nuevo reporte', associatedEvent: 'report_created', type: 'system' },
  ];

  for (const tpl of staticTemplates) {
    try {
      const content = await fs.readFile(path.join(templateDir, tpl.file), 'utf8');
      const [existing] = await EmailTemplate.findOrCreate({
        where: { name: tpl.name },
        defaults: {
          name: tpl.name,
          subject: tpl.subject,
          body: content,
          variables: [],
          type: tpl.type,
          associatedEvent: tpl.associatedEvent,
          isActive: true,
          headerColor: '#b91c1c',
          buttonColor: '#16a34a',
          footerColor: '#1f2937',
          backgroundColor: '#f3f4f6',
          titleColor: '#ffffff',
          footerTitleColor: '#ffffff',
        },
      });
      if (!existing) {
        console.log(`✅ Plantilla estática "${tpl.name}" sincronizada.`);
      }
    } catch (err) {
      console.error(`⚠️ Error sincronizando plantilla ${tpl.name}:`, err.message);
    }
  }
}

exports.syncStaticTemplates = syncStaticTemplates;

exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.findAll({ order: [['name', 'ASC']] });
    res.json(templates);
  } catch (error) {
    console.error('Error en getAllTemplates:', error);
    res.status(500).json({ message: 'Error al obtener plantillas' });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const template = await EmailTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ message: 'Plantilla no encontrada' });
    res.json(template);
  } catch (error) {
    console.error('Error en getTemplateById:', error);
    res.status(500).json({ message: 'Error al obtener plantilla' });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const {
      name, subject, body, variables, type, associatedEvent,
      headerColor, buttonColor, footerColor, backgroundColor,
      titleColor, footerTitleColor
    } = req.body;

    // Solo permitir crear plantillas de tipo petición
    if (associatedEvent !== 'petition') {
      return res.status(403).json({ message: 'Solo se pueden crear plantillas de petición' });
    }

    if (!name || !subject || !body) {
      return res.status(400).json({ message: 'Nombre, asunto y cuerpo son requeridos' });
    }

    // Validación anti-SSTI: bloquear patrones peligrosos antes de persistir
    if (DANGEROUS_TEMPLATE_PATTERN.test(body) || DANGEROUS_TEMPLATE_PATTERN.test(subject)) {
      return res.status(400).json({
        message: 'El contenido de la plantilla contiene patrones no permitidos',
      });
    }

    const template = await EmailTemplate.create({
      name,
      subject,
      body,
      variables: variables || [],
      type: type || 'custom',
      associatedEvent,
      headerColor: headerColor || '#b91c1c',
      buttonColor: buttonColor || '#16a34a',
      footerColor: footerColor || '#1f2937',
      backgroundColor: backgroundColor || '#f3f4f6',
      titleColor: titleColor || '#ffffff',
      footerTitleColor: footerTitleColor || '#ffffff',
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error en createTemplate:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Ya existe una plantilla con ese nombre' });
    }
    res.status(500).json({ message: 'Error al crear plantilla' });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ message: 'Plantilla no encontrada' });

    // Solo se pueden editar plantillas de petición
    if (template.associatedEvent !== 'petition') {
      return res.status(403).json({ message: 'Solo se pueden editar plantillas de petición' });
    }

    const {
      name, subject, body, variables, isActive,
      headerColor, buttonColor, footerColor, backgroundColor,
      titleColor, footerTitleColor
    } = req.body;

    // Validación anti-SSTI: comprobar los valores efectivos (nuevos o los ya guardados)
    const effectiveBody = body !== undefined ? body : template.body;
    const effectiveSubject = subject !== undefined ? subject : template.subject;
    if (DANGEROUS_TEMPLATE_PATTERN.test(effectiveBody) || DANGEROUS_TEMPLATE_PATTERN.test(effectiveSubject)) {
      return res.status(400).json({
        message: 'El contenido de la plantilla contiene patrones no permitidos',
      });
    }

    await template.update({
      name: name !== undefined ? name : template.name,
      subject: subject !== undefined ? subject : template.subject,
      body: body !== undefined ? body : template.body,
      variables: variables !== undefined ? variables : template.variables,
      isActive: isActive !== undefined ? isActive : template.isActive,
      headerColor: headerColor !== undefined ? headerColor : template.headerColor,
      buttonColor: buttonColor !== undefined ? buttonColor : template.buttonColor,
      footerColor: footerColor !== undefined ? footerColor : template.footerColor,
      backgroundColor: backgroundColor !== undefined ? backgroundColor : template.backgroundColor,
      titleColor: titleColor !== undefined ? titleColor : template.titleColor,
      footerTitleColor: footerTitleColor !== undefined ? footerTitleColor : template.footerTitleColor,
    });

    res.json(template);
  } catch (error) {
    console.error('Error en updateTemplate:', error);
    res.status(500).json({ message: 'Error al actualizar plantilla' });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ message: 'Plantilla no encontrada' });

    if (template.associatedEvent !== 'petition' || template.type === 'system') {
      return res.status(403).json({ message: 'No se puede eliminar esta plantilla' });
    }

    await template.destroy();
    res.json({ message: 'Plantilla eliminada' });
  } catch (error) {
    console.error('Error en deleteTemplate:', error);
    res.status(500).json({ message: 'Error al eliminar plantilla' });
  }
};

exports.sendCampaign = async (req, res) => {
  try {
    const { templateId, filter } = req.body;
    const template = await EmailTemplate.findByPk(templateId);
    if (!template) return res.status(404).json({ message: 'Plantilla no encontrada' });

    let where = { status: 'active' };
    if (filter === 'reminders') where.sendReminders = true;

    const subscribers = await Subscriber.findAll({ where });
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (const sub of subscribers) {
      const compileData = {
        username: sub.email.split('@')[0],
        email: sub.email,
        unsubscribeLink: `${baseUrl}/unsubscribe?email=${encodeURIComponent(sub.email)}`,
        preferencesLink: `${baseUrl}/preferences?email=${encodeURIComponent(sub.email)}`,
        currentYear: new Date().getFullYear(),
        action: null,
        campaign: null,
      };

      try {
        await sendEmailWithTemplate(sub.email, template, compileData);
      } catch (err) {
        console.error(`Error enviando a ${sub.email}:`, err);
      }
    }

    res.json({ message: `Correos enviados a ${subscribers.length} suscriptores` });
  } catch (error) {
    console.error('Error en sendCampaign:', error);
    res.status(500).json({ message: 'Error al enviar campaña de correos' });
  }
};

exports.sendTest = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findByPk(id);
    if (!template) return res.status(404).json({ message: 'Plantilla no encontrada' });

    const user = req.user;
    if (!user.email) {
      return res.status(400).json({ message: 'Tu cuenta no tiene email configurado' });
    }

    const testData = {
      username: user.username || 'Admin',
      email: user.email,
      campaign: { name: 'Campaña de ejemplo', description: 'Descripción de prueba' },
      action: { title: 'Acción de prueba', datetime: new Date().toISOString(), description: 'Detalles de la acción', registrationLink: '#' },
      unsubscribeLink: '#',
      preferencesLink: '#',
      currentYear: new Date().getFullYear(),
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    };

    try {
      await sendEmailWithTemplate(user.email, template, testData);
    } catch (err) {
      console.error('Error al compilar la plantilla:', err);
      return res.status(500).json({ message: 'Error al compilar la plantilla' });
    }

    res.json({ message: 'Correo de prueba enviado a tu email' });
  } catch (error) {
    console.error('Error en sendTest:', error);
    res.status(500).json({ message: 'Error al enviar la prueba' });
  }
};