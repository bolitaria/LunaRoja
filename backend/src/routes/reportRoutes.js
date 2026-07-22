const express = require('express');
const router = express.Router();
const { authenticate: authMiddleware } = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const templateController = require('../controllers/emailTemplateController');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET / y /:id accesibles para cualquier admin (el controlador no filtra por rol)
router.get('/', templateController.getAllTemplates);
router.get('/:id', templateController.getTemplateById);

// POST y PUT: pueden hacerlo superadmin, campaign_admin, blog_admin
const canEditTemplates = (req, res, next) => {
  const allowedRoles = ['superadmin', 'campaign_admin', 'blog_admin'];
  if (allowedRoles.includes(req.user.role)) return next();
  res.status(403).json({ message: 'No tienes permiso para modificar plantillas' });
};

router.post('/', canEditTemplates, templateController.createTemplate);
router.put('/:id', canEditTemplates, templateController.updateTemplate);

// DELETE: solo superadmin
router.delete('/:id', isSuperAdmin, templateController.deleteTemplate);

// Envío de campaña masiva (solo superadmin)
router.post('/send', isSuperAdmin, templateController.sendCampaign);

// Enviar prueba (cualquier admin con acceso a plantillas)
router.post('/:id/test', canEditTemplates, templateController.sendTest);

module.exports = router;