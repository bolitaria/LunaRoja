// backend/src/routes/healthRoutes.js
const router = require('express').Router();
const { checkLive, checkReady } = require('../services/healthService');

// Liveness probe (Kubernetes / Docker)
router.get('/live', (req, res) => {
  res.status(200).json(checkLive());
});

// Readiness probe
router.get('/ready', async (req, res) => {
  const health = await checkReady();
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// Compatibilidad: /health responde igual que /ready
router.get('/', async (req, res) => {
  const health = await checkReady();
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

module.exports = router;