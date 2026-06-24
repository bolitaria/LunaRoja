const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');
const authMiddleware = require('../middlewares/auth');          // ← corregido (sin llaves)
const { isSuperAdmin } = require('../middlewares/authorize');

// Rutas públicas
router.post('/', subscriberController.createSubscriber);
router.post('/unsubscribe', subscriberController.unsubscribe);
router.put('/preferences', subscriberController.updatePreferences);

// Rutas protegidas (solo superadmin)
router.get('/', authMiddleware, isSuperAdmin, subscriberController.getAllSubscribers);
router.delete('/:id', authMiddleware, isSuperAdmin, subscriberController.deleteSubscriber);

module.exports = router;