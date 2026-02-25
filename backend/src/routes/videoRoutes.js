const express = require('express');
const {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
} = require('../controllers/videoController');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

// Rutas públicas
router.get('/', getAllVideos);
router.get('/:id', getVideoById);

// Rutas protegidas (admin)
router.post('/', authMiddleware, createVideo);
router.put('/:id', authMiddleware, updateVideo);
router.delete('/:id', authMiddleware, deleteVideo);

module.exports = router;