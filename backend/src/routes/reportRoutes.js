const express = require('express');
const router = express.Router();
const { authenticate: authMiddleware } = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const { isSuperAdmin, canManageReports } = require('../middlewares/authorize');
const cache = require('../middlewares/cache');
const reportController = require('../controllers/reportController');
const uploadEntity = require('../middlewares/uploadEntity');

// Lectura pública con caché
router.get('/', optionalAuth, cache(60, 'reports'), reportController.getAllReports);
router.get('/:id', optionalAuth, cache(60, 'reports'), reportController.getReportById);

// Escritura: superadmin, blog_admin, campaign_admin
router.post('/', authMiddleware, canManageReports, uploadEntity, reportController.createReport);
router.put('/:id', authMiddleware, canManageReports, uploadEntity, reportController.updateReport);

// DELETE: solo superadmin
router.delete('/:id', authMiddleware, isSuperAdmin, reportController.deleteReport);

module.exports = router;
