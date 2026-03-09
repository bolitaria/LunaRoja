const express = require('express');
const {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
} = require('../controllers/videoController');
const authMiddleware = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const { isSuperAdmin } = require('../middlewares/authorize');
const router = express.Router();

// Rutas públicas con autenticación opcional
router.get('/', optionalAuth, getAllVideos);
router.get('/:id', optionalAuth, getVideoById);

// Rutas protegidas (solo superadmin para crear y eliminar, aunque el controlador permite campaign_admin)
router.post('/', authMiddleware, createVideo);
router.put('/:id', authMiddleware, updateVideo);
router.delete('/:id', authMiddleware, isSuperAdmin, deleteVideo);

module.exports = router;