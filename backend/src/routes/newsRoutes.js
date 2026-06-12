const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');

// Rutas públicas
router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);

// Rutas protegidas (solo superadmin)
router.post('/', authMiddleware, isSuperAdmin, newsController.createNews);
router.put('/:id', authMiddleware, isSuperAdmin, newsController.updateNews);
router.delete('/:id', authMiddleware, isSuperAdmin, newsController.deleteNews);

module.exports = router;