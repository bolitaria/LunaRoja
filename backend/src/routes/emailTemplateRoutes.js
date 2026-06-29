const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const templateController = require('../controllers/emailTemplateController');

router.use(authMiddleware);
router.use(isSuperAdmin);

router.get('/', templateController.getAllTemplates);
router.get('/:id', templateController.getTemplateById);
router.post('/', templateController.createTemplate);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);
router.post('/send', templateController.sendCampaign);

module.exports = router;