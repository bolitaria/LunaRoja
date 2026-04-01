const express = require('express');
const router = express.Router();
const chatGroupController = require('../controllers/chatGroupController');
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');

// Rutas públicas (para usuarios no autenticados)
router.get('/', chatGroupController.getAllGroups);
router.get('/:id', chatGroupController.getGroupById);

// Rutas protegidas (solo superadmin y campaign_admin)
router.post('/', authMiddleware, chatGroupController.createGroup);
router.put('/:id', authMiddleware, chatGroupController.updateGroup);
router.delete('/:id', authMiddleware, isSuperAdmin, chatGroupController.deleteGroup);

module.exports = router;