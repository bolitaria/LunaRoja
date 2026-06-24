const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const reportController = require('../controllers/reportController');

// Configuración de almacenamiento para reportes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'report-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

// Rutas públicas (sin autenticación)
router.get('/', reportController.getAllReports);
router.get('/:id', reportController.getReportById);

// Rutas protegidas (solo superadmin)
router.post('/', authMiddleware, isSuperAdmin, upload.single('file'), reportController.createReport);
router.put('/:id', authMiddleware, isSuperAdmin, upload.single('file'), reportController.updateReport);
router.delete('/:id', authMiddleware, isSuperAdmin, reportController.deleteReport);

module.exports = router;