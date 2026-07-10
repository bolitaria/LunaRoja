const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticate: authMiddleware } = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');

// Rutas públicas (sin autenticación)
router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);

// Rutas protegidas (solo superadmin para crear/editar/eliminar)
router.post('/', authMiddleware, isSuperAdmin, newsController.createNews);
router.put('/:id', authMiddleware, isSuperAdmin, newsController.updateNews);
router.delete('/:id', authMiddleware, isSuperAdmin, newsController.deleteNews);

module.exports = router;