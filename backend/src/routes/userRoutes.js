const express = require('express');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changeMyPassword, // <-- importar la nueva función
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const router = express.Router();

// Rutas existentes
router.get('/', authMiddleware, isSuperAdmin, getAllUsers);
router.post('/', authMiddleware, isSuperAdmin, createUser);
router.put('/:id', authMiddleware, isSuperAdmin, updateUser);
router.delete('/:id', authMiddleware, isSuperAdmin, deleteUser);

// Nueva ruta para cambiar la propia contraseña (cualquier usuario autenticado)
router.put('/me/password', authMiddleware, changeMyPassword);

module.exports = router;