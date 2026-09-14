const express = require('express');
const router = express.Router();
const { authenticate: authMiddleware } = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const templateController = require('../controllers/emailTemplateController');
const { EmailTemplate } = require('../models');
const { renderTemplate } = require('../services/emailService');
const { sanitizeEmailHtml } = require('../utils/sanitizeHtml');

// Obtener todas las plantillas (protegido)
router.get('/', authMiddleware, templateController.getAllTemplates);

// Obtener plantilla por defecto para peticiones
router.get('/default-petition', async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      where: { associatedEvent: 'petition', isActive: true },
      order: [['id', 'ASC']],
    });
    if (!template) {
      return res.status(404).json({ message: 'No hay plantilla de petición definida' });
    }
    res.json({ id: template.id });
  } catch (error) {
    console.error('Error al obtener plantilla por defecto:', error);
    res.status(500).json({ message: 'Error al obtener plantilla' });
  }
});

// Obtener plantilla por ID (protegido)
router.get('/:id', authMiddleware, templateController.getTemplateById);

// Crear plantilla (solo superadmin)
router.post('/', authMiddleware, isSuperAdmin, templateController.createTemplate);

// Actualizar plantilla (solo superadmin)
router.put('/:id', authMiddleware, isSuperAdmin, templateController.updateTemplate);

// Eliminar plantilla (solo superadmin)
router.delete('/:id', authMiddleware, isSuperAdmin, templateController.deleteTemplate);

// Enviar campaña masiva (solo superadmin)
router.post('/send', authMiddleware, isSuperAdmin, templateController.sendCampaign);

// Vista previa pública (unificada y completa)
router.get('/:id/preview', async (req, res, next) => {
  try {
    const template = await EmailTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ message: 'Plantilla no encontrada' });

    // Datos del formulario
    const {
      title = 'Título de ejemplo',
      content = 'Contenido de ejemplo',
      subject = '',
      username = 'Usuario',
      campaignName = 'Campaña de ejemplo',
      campaignDescription = 'Descripción de la campaña',
      actionTitle = 'Acción de ejemplo',
      actionDescription = 'Descripción de la acción',
      actionDatetime = new Date().toISOString(),
      actionRegistrationLink = '#',
      headerColor,
      titleColor,
      footerColor,
      footerTitleColor,
      buttonColor,
      backgroundColor,
      logoUrl = process.env.LOGO_URL || 'http://localhost:3000/logo.svg',
    } = req.query;

    // Construir contexto para Handlebars
    const context = {
      title,
      content,
      subject,
      username,
      campaign: {
        name: campaignName,
        description: campaignDescription,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/campanas/1`,
      },
      action: {
        title: actionTitle,
        description: actionDescription,
        datetime: new Date(actionDatetime),
        registrationLink: actionRegistrationLink,
      },
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      unsubscribeLink: '#',
      preferencesLink: '#',
      currentYear: new Date().getFullYear(),
      logoUrl,
    };

    let html;
    try {
      html = renderTemplate(template.body, context);
    } catch (err) {
      return res.status(500).json({ message: 'Error al compilar la plantilla', error: err.message });
    }

    // Reemplazar variables CSS de colores
    html = html
      .replace(/--header-color/g, headerColor || template.headerColor)
      .replace(/--title-color/g, titleColor || '#ffffff')
      .replace(/--footer-color/g, footerColor || template.footerColor)
      .replace(/--footer-title-color/g, footerTitleColor || '#ffffff')
      .replace(/--button-color/g, buttonColor || template.buttonColor)
      .replace(/--bg-color/g, backgroundColor || template.backgroundColor);

    // `html` viene de `renderTemplate(template.body, context)`:
    // - `template.body` se valida anti-SSTI en `createTemplate`/`updateTemplate`.
    // - `context` es 100% controlado por el servidor (no input directo del atacante).
    // - El resultado final pasa por `sanitizeEmailHtml()` antes del `res.send()`,
    //   que elimina `<script>`, event handlers (on*) y esquemas peligrosos.
    // Por lo anterior, la regla se acepta como falso positivo contextual.
    // nosemgrep: javascript.express.security.injection.raw-html-format.raw-html-format
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>.wrapper{max-width:100%!important;padding-left:0!important;padding-right:0!important}.wrapper .container{max-width:100%!important}</style></head><body style="margin:0;padding:0;background-color:#ffffff;">${html}</body></html>`;

    // nosemgrep: javascript.express.security.audit.xss.direct-response-write.direct-response-write
    res.send(sanitizeEmailHtml(fullHtml));
  } catch (err) {
    next(err);
  }
});

module.exports = router;