const express = require('express');
const router = express.Router();
const { authenticate: authMiddleware } = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const templateController = require('../controllers/emailTemplateController');

// Cualquier administrador autenticado puede ver plantillas
router.get('/', authMiddleware, templateController.getAllTemplates);
router.get('/:id', authMiddleware, templateController.getTemplateById);

// Solo superadmin puede crear, editar, eliminar y enviar
router.post('/', authMiddleware, isSuperAdmin, templateController.createTemplate);
router.put('/:id', authMiddleware, isSuperAdmin, templateController.updateTemplate);
router.delete('/:id', authMiddleware, isSuperAdmin, templateController.deleteTemplate);
router.post('/send', authMiddleware, isSuperAdmin, templateController.sendCampaign);

module.exports = router;