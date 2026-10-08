const express = require('express');
const router = express.Router();
const SubscriberCampaign = require('../models/SubscriberCampaign');
const SubscriberAction = require('../models/SubscriberAction');

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

module.exports = router;