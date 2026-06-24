const express = require('express');
const router = express.Router();
const dbAdminController = require('../controllers/dbAdminController');
const authMiddleware = require('../middlewares/auth');         
const { isSuperAdmin } = require('../middlewares/authorize');

// Proteger todas las rutas con autenticación y rol superadmin
router.use(authMiddleware);
router.use(isSuperAdmin);

// Ruta raíz → GET /api/database (información general de la BD)
router.get('/', dbAdminController.getDatabaseInfo);

// Información detallada (alias /info también funciona)
router.get('/info', dbAdminController.getDatabaseInfo);

// Índices de una tabla
router.get('/tables/:tableName/indexes', dbAdminController.getTableIndexes);

// Backup (descarga de un dump SQL)
router.get('/backup', dbAdminController.backup);

// Ejecutar migraciones pendientes
router.post('/migrations', dbAdminController.runMigrations);

module.exports = router;