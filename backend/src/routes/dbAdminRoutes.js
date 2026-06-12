const express = require('express');
const router = express.Router();
const dbAdminController = require('../controllers/dbAdminController');
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');

router.use(authMiddleware, isSuperAdmin);

// Información general
router.get('/info', dbAdminController.getDatabaseInfo);
router.get('/table/:tableName/indexes', dbAdminController.getTableIndexes);

// Índices duplicados
router.get('/check-duplicates', dbAdminController.checkDuplicates);
router.post('/clean-duplicates', dbAdminController.cleanDuplicates);

// Backup y migraciones
router.get('/backup', dbAdminController.backup);
router.post('/migrate', dbAdminController.runMigrations);

module.exports = router;