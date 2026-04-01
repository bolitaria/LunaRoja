const express = require('express');
const {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getPosts,
  manualScrape, // solo si existe
} = require('../controllers/instagramController');
const authMiddleware = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const { isSuperAdmin } = require('../middlewares/authorize');
const router = express.Router();

// Rutas públicas (posts)
router.get('/posts', optionalAuth, getPosts);

// Rutas protegidas
router.get('/accounts', authMiddleware, getAllAccounts);
router.get('/accounts/:id', authMiddleware, getAccountById);
router.post('/accounts', authMiddleware, isSuperAdmin, createAccount);
router.put('/accounts/:id', authMiddleware, isSuperAdmin, updateAccount);
router.delete('/accounts/:id', authMiddleware, isSuperAdmin, deleteAccount);

// Scraping manual (opcional, solo si manualScrape está definida)
if (manualScrape) {
  router.post('/scrape/:id', authMiddleware, isSuperAdmin, manualScrape);
}

module.exports = router;