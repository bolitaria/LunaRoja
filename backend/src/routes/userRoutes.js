const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');

// Autenticación
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/refresh', authController.refresh);

// Perfil y cambio de contraseña (autenticado)
router.get('/users/me', authMiddleware, userController.getMe);
router.put('/users/me/password', authMiddleware, userController.changeMyPassword);

// ✅ LISTAR USUARIOS (solo superadmin o campaign_admin según la lógica del controlador)
router.get('/users', authMiddleware, userController.getAllUsers);   // ← AÑADIR ESTA LÍNEA

// Recuperación de contraseña
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

module.exports = router;