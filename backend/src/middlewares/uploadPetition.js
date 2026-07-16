const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ruta dentro del contenedor/runner
const petitionDir = '/app/uploads/petitions';

// Crear el directorio si no existe, con permisos amplios, sin lanzar error
try {
  if (!fs.existsSync(petitionDir)) {
    fs.mkdirSync(petitionDir, { recursive: true, mode: 0o777 });
  } else {
    // Si ya existe, aseguramos que sea escribible
    fs.chmodSync(petitionDir, 0o777);
  }
} catch (err) {
  // No detenemos la app; multer fallará después si realmente no puede escribir
  console.warn(`⚠️  No se pudo crear/ajustar ${petitionDir}: ${err.message}`);
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

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('image');