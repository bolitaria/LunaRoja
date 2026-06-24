const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const dashboardController = require('../controllers/dashboardController');

// Solo superadmin puede acceder al dashboard
router.get('/', authMiddleware, isSuperAdmin, dashboardController.getDashboardData);

module.exports = router;