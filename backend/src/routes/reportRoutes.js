const express = require('express');
const {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
} = require('../controllers/reportController');
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const upload = require('../middlewares/upload'); // Asumiendo que existe para reportes
const router = express.Router();

// Rutas públicas (accesibles sin autenticación)
router.get('/', getAllReports);
router.get('/:id', getReportById);

// Rutas protegidas (solo superadmin)
router.post('/', authMiddleware, isSuperAdmin, upload.single('file'), createReport);
router.put('/:id', authMiddleware, isSuperAdmin, upload.single('file'), updateReport);
router.delete('/:id', authMiddleware, isSuperAdmin, deleteReport);

module.exports = router;