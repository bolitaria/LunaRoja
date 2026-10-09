const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');
const { authenticate: authMiddleware } = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const SubscriberCampaign = require('../models/SubscriberCampaign');
const SubscriberAction = require('../models/SubscriberAction');

// ── Rutas públicas ─────────────────────────────────────────────
router.post('/', subscriberController.createSubscriber);
router.post('/unsubscribe', subscriberController.unsubscribe);
router.put('/preferences', subscriberController.updatePreferences);

// ── Baja de seguimiento (público, vía email) ───────────────────
router.get('/unfollow-campaign', async (req, res) => {
  const { subscriberId, type, id } = req.query;
  if (!subscriberId || !type || !id) return res.status(400).json({ message: 'Parámetros requeridos' });
  const where = { subscriberId };
  if (type === 'bds') where.bdsId = id;
  else where.campaignId = id;
  await SubscriberCampaign.update({ isFollowing: false }, { where });
  res.send('Has dejado de seguir esta campaña.');
});

router.get('/unfollow-action', async (req, res) => {
  const { subscriberId, actionId } = req.query;
  if (!subscriberId || !actionId) return res.status(400).json({ message: 'Parámetros requeridos' });
  await SubscriberAction.update({ isFollowing: false }, { where: { subscriberId, actionId } });
  res.send('Has dejado de seguir esta acción.');
});

// ── Rutas protegidas (solo superadmin) ─────────────────────────
router.get('/', authMiddleware, isSuperAdmin, subscriberController.getAllSubscribers);
router.delete('/:id', authMiddleware, isSuperAdmin, subscriberController.deleteSubscriber);

// ── Métricas agregadas (solo superadmin) ───────────────────────
router.get('/metrics', authMiddleware, isSuperAdmin, subscriberController.getMetrics);
router.get('/by-campaign', authMiddleware, isSuperAdmin, subscriberController.getByCampaign);
router.get('/by-action', authMiddleware, isSuperAdmin, subscriberController.getByAction);
router.get('/activity', authMiddleware, isSuperAdmin, subscriberController.getActivity);

module.exports = router;
