const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;
    if (file.fieldname === 'featuredImage') {
      uploadDir = path.join(__dirname, '../../uploads/featured');
    } else if (file.fieldname === 'document') {
      uploadDir = path.join(__dirname, '../../uploads/documents');
    } else {
      uploadDir = path.join(__dirname, '../../uploads/actions');
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    let prefix = 'action-';
    if (file.fieldname === 'featuredImage') prefix = 'featured-';
    else if (file.fieldname === 'document') prefix = 'doc-';
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'document') {
    // Permitir documentos
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de documento no permitido'), false);
    }
  } else {
    // Solo imágenes para el resto
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

module.exports = upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'images', maxCount: 20 },
  { name: 'document', maxCount: 1 }
]);