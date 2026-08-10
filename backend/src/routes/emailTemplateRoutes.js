const express = require('express');
const router = express.Router();
const { authenticate: authMiddleware } = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const templateController = require('../controllers/emailTemplateController');
const { EmailTemplate } = require('../models');

router.get('/', authMiddleware, templateController.getAllTemplates);
router.get('/:id', authMiddleware, templateController.getTemplateById);
router.post('/', authMiddleware, isSuperAdmin, templateController.createTemplate);
router.put('/:id', authMiddleware, isSuperAdmin, templateController.updateTemplate);
router.delete('/:id', authMiddleware, isSuperAdmin, templateController.deleteTemplate);
router.post('/send', authMiddleware, isSuperAdmin, templateController.sendCampaign);

// Vista previa pública con título y contenido dinámicos
router.get('/:id/preview', async (req, res, next) => {
  try {
    const template = await EmailTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ message: 'Plantilla no encontrada' });

    const headerColor = req.query.headerColor || template.headerColor;
    const buttonColor = req.query.buttonColor || template.buttonColor;
    const footerColor = req.query.footerColor || template.footerColor;
    const backgroundColor = req.query.backgroundColor || template.backgroundColor;
    const logoUrl = process.env.LOGO_URL || 'http://localhost:3000/logo.svg';

    // Título y contenido reales (o placeholder si están vacíos)
    const title = req.query.title || 'Título de ejemplo';
    const content = req.query.content || 'Contenido de la petición de ejemplo.';

    const body = template.body
      .replace(/\{\{title\}\}/g, title)
      .replace(/\{\{content\}\}/g, content)
      .replace(/\{\{url\}\}/g, '#')
      .replace(/\{\{logoUrl\}\}/g, logoUrl)
      .replace(/\{\{buttonColor\}\}/g, buttonColor)
      .replace(/\{\{headerColor\}\}/g, headerColor)
      .replace(/\{\{footerColor\}\}/g, footerColor)
      .replace(/\{\{backgroundColor\}\}/g, backgroundColor)
      .replace(/\{\{currentYear\}\}/g, new Date().getFullYear())
      .replace(/\{\{unsubscribeLink\}\}/g, '#');

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background-color:${backgroundColor};">
  ${body}
</body>
</html>`;

    res.send(html);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// Vista previa pública (ancho completo)
router.get('/:id/preview', async (req, res, next) => {
  try {
    const template = await EmailTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ message: 'Plantilla no encontrada' });

    const headerColor = req.query.headerColor || template.headerColor;
    const titleColor = req.query.titleColor || template.titleColor || '#ffffff';
    const footerColor = req.query.footerColor || template.footerColor;
    const footerTitleColor = req.query.footerTitleColor || template.footerTitleColor || '#ffffff';
    const logoUrl = process.env.LOGO_URL || 'http://localhost:3000/logo.svg';

    const title = req.query.title || 'Título de ejemplo';
    const content = req.query.content || 'Contenido de ejemplo.';
    const subject = req.query.subject || '';

    let body = template.body
      .replace(/\{\{title\}\}/g, title)
      .replace(/\{\{content\}\}/g, content)
      .replace(/\{\{headerColor\}\}/g, headerColor)
      .replace(/\{\{titleColor\}\}/g, titleColor)
      .replace(/\{\{footerColor\}\}/g, footerColor)
      .replace(/\{\{footerTitleColor\}\}/g, footerTitleColor)
      .replace(/\{\{logoUrl\}\}/g, logoUrl)
      .replace(/\{\{currentYear\}\}/g, new Date().getFullYear())
      .replace(/\{\{unsubscribeLink\}\}/g, '#');

    // Inyectar estilo para que el wrapper ocupe todo el ancho en la vista previa
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  .wrapper, .wrapper .container { max-width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
  .wrapper { padding: 0 !important; }
</style>
</head>
<body style="margin:0; padding:0; background-color:#ffffff;">
  ${body}
</body>
</html>`;

    res.send(html);
  } catch (err) { next(err); }
});
