const express = require('express');
const {
  getAllSubscribers,
  createSubscriber,
  unsubscribe,
  deleteSubscriber,
} = require('../controllers/subscriberController');
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const router = express.Router();

// Rutas públicas
router.post('/', createSubscriber);
router.post('/unsubscribe', unsubscribe);

// Rutas protegidas (solo superadmin)
router.get('/', authMiddleware, isSuperAdmin, getAllSubscribers);
router.delete('/:id', authMiddleware, isSuperAdmin, deleteSubscriber);

module.exports = router;