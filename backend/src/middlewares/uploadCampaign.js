const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;
    if (file.fieldname === 'image') {
      uploadDir = path.join(__dirname, '../../uploads/campaigns');
    } else if (file.fieldname === 'document') {
      uploadDir = path.join(__dirname, '../../uploads/documents');
    } else {
      uploadDir = path.join(__dirname, '../../uploads/campaigns');
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'image' ? 'campaign-' : 'doc-';
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'document') {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de documento no permitido'), false);
    }
  } else {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
};

const uploadCampaign = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
});

// ✅ EXPORTA LA FUNCIÓN MIDDLEWARE DIRECTAMENTE
module.exports = uploadCampaign.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]);