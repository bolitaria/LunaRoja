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
const router = express.Router();

// Rutas públicas
router.get('/posts', getPosts);

// Rutas protegidas (admin)
router.get('/accounts', authMiddleware, getAllAccounts);
router.get('/accounts/:id', authMiddleware, getAccountById);
router.post('/accounts', authMiddleware, createAccount);
router.put('/accounts/:id', authMiddleware, updateAccount);
router.delete('/accounts/:id', authMiddleware, deleteAccount);

module.exports = router;