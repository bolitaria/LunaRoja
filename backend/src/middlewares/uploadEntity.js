/**
 * Middleware multer genérico para cualquier entidad (action, campaign, bds, report).
 *
 * Contrato del FormData (todos los campos opcionales):
 *   featuredImage              → 1 imagen principal
 *   images[]  o  images        → N imágenes de galería
 *   documents[N][name]         → nombre del documento N
 *   documents[N][file]         → fichero del documento N
 *   documents[N][isPublic]     → 'true' | 'false'
 *
 * Todos los ficheros se guardan en /app/uploads/tmp/ con nombres UUID.
 * El worker `entity-post-process` los mueve/optimiza/registra.
 *
 * Sustituye a los antiguos middlewares específicos por entidad
 * y al multer inline que había en las rutas.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const limits = require('../config/limits');

const TMP_DIR = '/app/uploads/tmp';

// Crear el directorio temporal si no existe (una vez por proceso)
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TMP_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Imágenes: featuredImage, images, images[]
  if (
    file.fieldname === 'featuredImage' ||
    file.fieldname === 'image' ||
    file.fieldname === 'images' ||
    file.fieldname === 'images[]'
  ) {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error(`Solo se permiten imágenes en ${file.fieldname}`), false);
  }

  // Documentos: documents[N][file]
  if (file.fieldname && file.fieldname.startsWith('documents[')) {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (limits.documents.allowedExtensions.includes(ext)) return cb(null, true);
    return cb(new Error(`Tipo de documento no permitido: .${ext}`), false);
  }

  cb(new Error(`Campo no permitido: ${file.fieldname}`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: limits.documents.maxFileSizeBytes }, // 20 MB global; límites específicos se validan luego
});

module.exports = upload.any();
