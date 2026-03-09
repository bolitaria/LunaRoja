const express = require('express');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changeMyPassword,
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

// Todas las rutas requieren autenticación, la autorización se maneja en el controlador
router.get('/', authMiddleware, getAllUsers);
router.post('/', authMiddleware, createUser);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deleteUser);
router.put('/me/password', authMiddleware, changeMyPassword);

module.exports = router;