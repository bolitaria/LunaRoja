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
    const { name, subject, body, variables, type, associatedEvent } = req.body;
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
    const { name, subject, body, variables, isActive } = req.body;
    await template.update({
      name: name || template.name,
      subject: subject || template.subject,
      body: body !== undefined ? body : template.body,
      variables: variables || template.variables,
      isActive: isActive !== undefined ? isActive : template.isActive,
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
        compiledHtml = Handlebars.compile(template.body)(compileData);
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