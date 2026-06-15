const express = require('express');
const router = express.Router();
const dbAdminController = require('../controllers/dbAdminController');
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');

router.use(authMiddleware, isSuperAdmin);

// Database general info
router.get('/info', dbAdminController.getDatabaseInfo);
router.get('/table/:tableName/indexes', dbAdminController.getTableIndexes);

// Backup and migrations
router.get('/backup', dbAdminController.backup);
router.post('/migrate', dbAdminController.runMigrations);

module.exports = router;
