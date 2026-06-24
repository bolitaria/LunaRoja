const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');

// Ruta del usuario autenticado (requiere authMiddleware)
router.get('/me', authMiddleware, userController.getMe);
router.put('/me/password', authMiddleware, userController.changeMyPassword);

// Rutas de administración (solo superadmin)
router.get('/', authMiddleware, isSuperAdmin, userController.getAllUsers);
router.post('/', authMiddleware, isSuperAdmin, userController.createUser);
router.put('/:id', authMiddleware, isSuperAdmin, userController.updateUser);
router.delete('/:id', authMiddleware, isSuperAdmin, userController.deleteUser);

module.exports = router;