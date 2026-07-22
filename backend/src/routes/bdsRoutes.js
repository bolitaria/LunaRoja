const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate: authMiddleware } = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');   // 🆕 igual que en campañas
const { isSuperAdmin } = require('../middlewares/authorize');
const bdsController = require('../controllers/bdsController');

// Configuración de almacenamiento para BDS (sin cambios)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;
    if (file.fieldname === 'image') {
      uploadDir = path.join(__dirname, '../../uploads/bds');
    } else if (file.fieldname === 'document') {
      uploadDir = path.join(__dirname, '../../uploads/documents');
    } else {
      uploadDir = path.join(__dirname, '../../uploads/others');
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

// ✅ Lectura pública (opcionalmente autenticada) – mismo comportamiento que Campañas
router.get('/', optionalAuth, bdsController.getAllBDS);
router.get('/:id', optionalAuth, bdsController.getBDSById);

// Escritura: solo superadmin, con multer para campos 'image' y 'document'
router.post('/',
  authMiddleware,
  isSuperAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ]),
  bdsController.createBDS
);

router.put('/:id',
  authMiddleware,
  isSuperAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ]),
  bdsController.updateBDS
);

router.delete('/:id', authMiddleware, isSuperAdmin, bdsController.deleteBDS);

module.exports = router;