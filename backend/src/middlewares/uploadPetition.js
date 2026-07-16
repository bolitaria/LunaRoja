const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Guardado dentro del volumen Docker
const petitionDir = '/app/uploads/petitions';
if (!fs.existsSync(petitionDir)) {
  fs.mkdirSync(petitionDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, petitionDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'petition-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Solo se permiten imágenes'), false);
};

// ✅ Campo esperado: 'image' (igual que el frontend)
module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('image');