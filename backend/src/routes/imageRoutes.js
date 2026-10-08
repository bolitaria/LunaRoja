const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { authenticate: authMiddleware } = require('../middlewares/auth');

// Ruta pública para ver todas las imágenes (la lógica de rol se aplica en el controlador si hay usuario)
router.get('/', imageController.getAllImages);

// Ruta protegida para eliminar una imagen (el controlador decide permisos según rol)
router.delete('/:id', authMiddleware, imageController.deleteImage);

module.exports = router;