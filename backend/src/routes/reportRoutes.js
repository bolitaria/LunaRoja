const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
} = require('../controllers/reportController');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/reports');
    // Crear directorio si no existe
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

const fileFilter = (req, file, cb) => {
  // Aceptar solo PDF
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Rutas públicas
router.get('/', getAllReports);
router.get('/:id', getReportById);

// Rutas protegidas (admin) con subida de archivos
router.post('/', authMiddleware, upload.single('file'), createReport);
router.put('/:id', authMiddleware, upload.single('file'), updateReport);
router.delete('/:id', authMiddleware, deleteReport);

module.exports = router;