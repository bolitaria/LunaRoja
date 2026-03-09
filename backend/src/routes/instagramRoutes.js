const express = require('express');
const {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getPosts,
} = require('../controllers/instagramController');
const authMiddleware = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const { isSuperAdmin } = require('../middlewares/authorize');
const router = express.Router();

// Rutas públicas (posts) con autenticación opcional
router.get('/posts', optionalAuth, getPosts);

// Rutas protegidas (solo superadmin para crear/editar, pero getAllAccounts puede filtrar por rol)
router.get('/accounts', authMiddleware, getAllAccounts);
router.get('/accounts/:id', authMiddleware, getAccountById);
router.post('/accounts', authMiddleware, isSuperAdmin, createAccount);
router.put('/accounts/:id', authMiddleware, isSuperAdmin, updateAccount);
router.delete('/accounts/:id', authMiddleware, isSuperAdmin, deleteAccount);

module.exports = router;