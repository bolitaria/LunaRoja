const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate: authMiddleware } = require('../middlewares/auth');

// Perfil del usuario autenticado
router.get('/me', authMiddleware, userController.getMe);
router.put('/me/password', authMiddleware, userController.changeMyPassword);

// Gestión de usuarios (solo superadmin / campaign_admin según el controlador)
router.get('/', authMiddleware, userController.getAllUsers);
router.post('/', authMiddleware, userController.createUser);
router.put('/:id', authMiddleware, userController.updateUser);
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;