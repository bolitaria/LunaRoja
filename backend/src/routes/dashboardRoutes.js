const express = require('express');
const router = express.Router();
const { authenticate: authMiddleware } = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const dashboardController = require('../controllers/dashboardController');

// Solo superadmin puede acceder al dashboard de estadísticas
router.get('/stats', authMiddleware, isSuperAdmin, dashboardController.getDashboardData);

module.exports = router;