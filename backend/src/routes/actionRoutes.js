const express = require('express');
const {
  getAllActions,
  getActionById,
  createAction,
  updateAction,
  deleteAction,
  deleteActionImage
} = require('../controllers/actionController');
const authMiddleware = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const { isSuperAdmin, canAccessAction } = require('../middlewares/authorize');
const uploadFields = require('../middlewares/uploadActions');
const router = express.Router();

// Rutas públicas con autenticación opcional
router.get('/', optionalAuth, getAllActions);
router.get('/:id', optionalAuth, getActionById);

// Rutas protegidas
router.post('/', authMiddleware, uploadFields, createAction);
router.put('/:id', authMiddleware, canAccessAction, uploadFields, updateAction);
router.delete('/:id', authMiddleware, isSuperAdmin, deleteAction);
router.delete('/images/:imageId', authMiddleware, deleteActionImage);

module.exports = router;