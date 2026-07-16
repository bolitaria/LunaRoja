const Handlebars = require('handlebars');
const EmailTemplate = require('../models/EmailTemplate');
const Subscriber = require('../models/Subscriber');
const { sendEmail } = require('../services/emailService');

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
      headerColor, buttonColor, footerColor, backgroundColor
    } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ message: 'Nombre, asunto y cuerpo son requeridos' });
    }

    const template = await EmailTemplate.create({
      name,
      subject,
      body,
      variables: variables || [],
      type: type || 'custom',
      associatedEvent: associatedEvent || 'custom',
      headerColor: headerColor || '#b91c1c',
      buttonColor: buttonColor || '#16a34a',
      footerColor: footerColor || '#1f2937',
      backgroundColor: backgroundColor || '#f3f4f6',
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

    const {
      name, subject, body, variables, isActive,
      headerColor, buttonColor, footerColor, backgroundColor
    } = req.body;

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
    if (template.type === 'system') {
      return res.status(403).json({ message: 'No se pueden eliminar plantillas del sistema' });
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

      let compiledHtml;
      try {
        compiledHtml = Handlebars.compile(template.body)(compileData); // nosemgrep
        compiledHtml = compiledHtml
          .replace(/--header-color/g, template.headerColor)
          .replace(/--button-color/g, template.buttonColor)
          .replace(/--footer-color/g, template.footerColor)
          .replace(/--bg-color/g, template.backgroundColor);
      } catch (err) {
        console.error(`Error compilando plantilla para ${sub.email}:`, err);
        continue;
      }

      await sendEmail(sub.email, template.subject, 'custom', {
        body: compiledHtml,
      }).catch(err => console.error(`Error enviando a ${sub.email}:`, err));
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

    let compiledHtml;
    try {
      compiledHtml = Handlebars.compile(template.body)(testData); // nosemgrep
      compiledHtml = compiledHtml
        .replace(/--header-color/g, template.headerColor)
        .replace(/--button-color/g, template.buttonColor)
        .replace(/--footer-color/g, template.footerColor)
        .replace(/--bg-color/g, template.backgroundColor);
    } catch (err) {
      return res.status(500).json({ message: 'Error al compilar la plantilla' });
    }

    await sendEmail(user.email, template.subject, 'custom', { body: compiledHtml });
    res.json({ message: 'Correo de prueba enviado a tu email' });
  } catch (error) {
    console.error('Error en sendTest:', error);
    res.status(500).json({ message: 'Error al enviar la prueba' });
  }
};