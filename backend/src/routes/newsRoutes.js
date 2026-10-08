// backend/src/routes/newsRoutes.js
const express = require('express');
const newsController = require('../controllers/newsController');
const { authenticate: authMiddleware } = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const { isSuperAdmin } = require('../middlewares/authorize');
const cache = require('../middlewares/cache');

const router = express.Router();

// Lectura pública con caché etiquetada
router.get('/', optionalAuth, cache(60, 'news'), newsController.getAllNews);
router.get('/:id', optionalAuth, cache(60, 'news'), newsController.getNewsById);

// Escritura (solo superadmin)
router.post('/', authMiddleware, isSuperAdmin, newsController.createNews);
router.put('/:id', authMiddleware, isSuperAdmin, newsController.updateNews);
router.delete('/:id', authMiddleware, isSuperAdmin, newsController.deleteNews);

module.exports = router;