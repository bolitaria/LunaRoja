const express = require('express');
const {
  getAllSubscribers,
  createSubscriber,
  unsubscribe,
  deleteSubscriber,
} = require('../controllers/subscriberController');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

// Rutas públicas
router.post('/', createSubscriber);
router.post('/unsubscribe', unsubscribe); // Público para que el usuario se desuscriba

// Rutas protegidas (admin)
router.get('/', authMiddleware, getAllSubscribers);
router.delete('/:id', authMiddleware, deleteSubscriber);

module.exports = router;