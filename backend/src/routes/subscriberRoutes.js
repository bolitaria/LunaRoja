const express = require('express');
const {
  getAllSubscribers,
  createSubscriber,
  unsubscribe,
  deleteSubscriber,
  updatePreferences,
} = require('../controllers/subscriberController');
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const router = express.Router();

// Public routes
router.post('/', createSubscriber);
router.post('/unsubscribe', unsubscribe);
router.put('/preferences', updatePreferences); // optional, could be protected if needed

// Protected routes (superadmin only)
router.get('/', authMiddleware, isSuperAdmin, getAllSubscribers);
router.delete('/:id', authMiddleware, isSuperAdmin, deleteSubscriber);

module.exports = router;