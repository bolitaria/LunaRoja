// routes/healthRoutes.js
const router = require('express').Router();
const { checkHealth } = require('../services/healthService');

router.get('/', async (req, res) => {
  const health = await checkHealth();
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

module.exports = router;