const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const bdsController = require('../controllers/bdsController');

// 📌 Lectura: cualquier usuario autenticado (el controlador filtra según el rol)
router.get('/', authMiddleware, bdsController.getAllBDS);
router.get('/:id', authMiddleware, bdsController.getBDSById);

// 📌 Escritura: solo superadmin
router.post('/', authMiddleware, isSuperAdmin, bdsController.createBDS);
router.put('/:id', authMiddleware, isSuperAdmin, bdsController.updateBDS);
router.delete('/:id', authMiddleware, isSuperAdmin, bdsController.deleteBDS);

module.exports = router;