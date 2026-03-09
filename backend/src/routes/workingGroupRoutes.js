const express = require('express');
const {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
} = require('../controllers/workingGroupController');
const authMiddleware = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const { isSuperAdmin } = require('../middlewares/authorize');
const router = express.Router();

// Rutas públicas con autenticación opcional
router.get('/', optionalAuth, getAllGroups);
router.get('/:id', optionalAuth, getGroupById);

// Rutas protegidas
router.post('/', authMiddleware, isSuperAdmin, createGroup);
router.put('/:id', authMiddleware, updateGroup); // updateGroup ya verifica permisos en el controlador
router.delete('/:id', authMiddleware, isSuperAdmin, deleteGroup);

module.exports = router;