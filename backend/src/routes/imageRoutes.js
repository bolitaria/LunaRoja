const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { authenticate: authMiddleware } = require('../middlewares/auth');          // ← corregido (sin llaves)
const { isSuperAdmin } = require('../middlewares/authorize');

// Ruta pública para ver todas las imágenes
router.get('/', imageController.getAllImages);

// Ruta protegida para eliminar una imagen (solo superadmin)
router.delete('/:id', authMiddleware, isSuperAdmin, imageController.deleteImage);

module.exports = router;