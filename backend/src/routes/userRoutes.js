const express = require('express');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const router = express.Router();

// Todas las rutas protegidas por autenticación y solo superadmin
router.get('/', authMiddleware, isSuperAdmin, getAllUsers);
router.post('/', authMiddleware, isSuperAdmin, createUser);
router.put('/:id', authMiddleware, isSuperAdmin, updateUser);
router.delete('/:id', authMiddleware, isSuperAdmin, deleteUser);

module.exports = router;