/**
 * ============================================================
 * StorageService
 * ============================================================
 * Único punto de acceso al sistema de ficheros bajo /uploads/.
 *
 * Estructura:
 *   /uploads/{entityDir}/{entityId}/{role}.{ext}
 *
 * Ejemplos:
 *   /uploads/actions/42/featured.webp
 *   /uploads/actions/42/gallery-01.webp
 *   /uploads/actions/42/doc-manifiesto-a1b2c3.pdf
 *   /uploads/campaigns/7/featured.png
 *   /uploads/bds/3/featured.webp
 *   /uploads/reports/12/doc-informe-xyz789.pdf
 *
 * Convenciones:
 *   - `filePath` en BD = URL pública ("/uploads/actions/42/featured.webp")
 *   - Internamente trabajamos con rutas absolutas ("/app/uploads/...")
 *   - Cualquier operación valida que la ruta final quede bajo /uploads/
 *
 * Flujo async (Opción 1):
 *   - multer escribe en /app/uploads/tmp/{uuid}.{ext}
 *   - el worker llama a saveFeatured / saveGalleryImage / saveDocument
 *     con ese temp path, y aquí hacemos fs.copyFile → destino final.
 *   - El worker llama a cleanupTemps() al terminar (o en error).
 *   - En caso de fallo tras N reintentos, los temp se borran por cron (>24h).
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const limits = require('../config/limits');

// ────────────────────────────────────────────────────────────
// Constantes
// ────────────────────────────────────────────────────────────

const UPLOADS_BASE = path.join(__dirname, '../../uploads');
const TMP_DIR = path.join(UPLOADS_BASE, 'tmp');

const ENTITY_DIRS = {
  action:   'actions',
  campaign: 'campaigns',
  bds:      'bds',
  report:   'reports',
};

const OPTIMIZABLE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.avif']);

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function sanitizeSlug(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';
}

function entityDir(entityType, entityId) {
  const dirName = ENTITY_DIRS[entityType];
  if (!dirName) {
    throw new Error(`entityType inválido: "${entityType}". Válidos: ${Object.keys(ENTITY_DIRS).join(', ')}`);
  }
  const id = parseInt(entityId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`entityId inválido: "${entityId}"`);
  }
  return path.join(UPLOADS_BASE, dirName, String(id));
}

function toAbsolute(publicPath) {
  if (!publicPath || typeof publicPath !== 'string') {
    throw new Error('publicPath requerido');
  }
  if (!publicPath.startsWith('/uploads/')) {
    throw new Error(`Ruta no permitida (debe empezar con /uploads/): "${publicPath}"`);
  }
  const relative = publicPath.slice('/uploads/'.length);
  const absolute = path.resolve(UPLOADS_BASE, relative);
  const base = path.resolve(UPLOADS_BASE);
  if (!absolute.startsWith(base + path.sep)) {
    throw new Error(`Ruta fuera de /uploads/: "${publicPath}"`);
  }
  return absolute;
}

function toPublic(absolutePath) {
  const base = path.resolve(UPLOADS_BASE);
  const abs = path.resolve(absolutePath);
  if (!abs.startsWith(base + path.sep)) {
    throw new Error(`Ruta fuera de /uploads/: "${absolutePath}"`);
  }
  const relative = path.relative(base, abs);
  return '/uploads/' + relative.split(path.sep).join('/');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function removeByPrefix(dir, prefix) {
  try {
    const entries = await fs.readdir(dir);
    await Promise.all(
      entries
        .filter((name) => name.startsWith(prefix + '.') || name.startsWith(prefix + '-'))
        .map((name) => fs.unlink(path.join(dir, name)).catch(() => {}))
    );
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

function shortRandom() {
  return crypto.randomBytes(3).toString('hex');
}

async function nextGalleryIndex(dir) {
  try {
    const entries = await fs.readdir(dir);
    const indices = entries
      .map((name) => name.match(/^gallery-(\d{2,})\./))
      .filter(Boolean)
      .map((m) => parseInt(m[1], 10));
    const next = indices.length > 0 ? Math.max(...indices) + 1 : 1;
    return String(next).padStart(2, '0');
  } catch (err) {
    if (err.code === 'ENOENT') return '01';
    throw err;
  }
}

// ────────────────────────────────────────────────────────────
// Guardado (temp → destino final con copyFile)
// ────────────────────────────────────────────────────────────

async function saveFeatured(entityType, entityId, file) {
  const dir = entityDir(entityType, entityId);
  await ensureDir(dir);

  const ext = path.extname(file.originalname).toLowerCase();
  if (!limits.images.allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`Tipo de imagen no permitido: ${file.mimetype}`);
  }
  if (file.size > limits.images.maxFileSizeBytes) {
    throw new Error(`Imagen demasiado grande (máx ${Math.round(limits.images.maxFileSizeBytes / 1024 / 1024)} MB)`);
  }

  const target = path.join(dir, `featured${ext}`);

  // Limpiar versiones anteriores (con cualquier extensión)
  await removeByPrefix(dir, 'featured');

  // Copiar (no mover) para permitir reintentos del job
  await fs.copyFile(file.path, target);

  return {
    filePath: toPublic(target),
    mimeType: file.mimetype,
    fileSize: file.size,
  };
}

async function saveGalleryImage(entityType, entityId, file) {
  const dir = entityDir(entityType, entityId);
  await ensureDir(dir);

  if (!limits.images.allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`Tipo de imagen no permitido: ${file.mimetype}`);
  }
  if (file.size > limits.images.maxFileSizeBytes) {
    throw new Error(`Imagen demasiado grande (máx ${Math.round(limits.images.maxFileSizeBytes / 1024 / 1024)} MB)`);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const idx = await nextGalleryIndex(dir);
  const target = path.join(dir, `gallery-${idx}${ext}`);

  await fs.copyFile(file.path, target);

  return {
    filePath: toPublic(target),
    mimeType: file.mimetype,
    fileSize: file.size,
  };
}

async function saveDocument(entityType, entityId, file, titleForSlug = '') {
  const dir = entityDir(entityType, entityId);
  await ensureDir(dir);

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (!limits.documents.allowedExtensions.includes(ext)) {
    throw new Error(`Extensión de documento no permitida: .${ext}`);
  }
  if (file.size > limits.documents.maxFileSizeBytes) {
    throw new Error(`Documento demasiado grande (máx ${Math.round(limits.documents.maxFileSizeBytes / 1024 / 1024)} MB)`);
  }

  const slug = sanitizeSlug(titleForSlug || path.parse(file.originalname).name);
  const filename = `doc-${slug}-${shortRandom()}.${ext}`;
  const target = path.join(dir, filename);

  await fs.copyFile(file.path, target);

  return {
    filePath: toPublic(target),
    mimeType: file.mimetype,
    fileSize: file.size,
  };
}

async function saveLogo(colectivoId, file) {
  const dir = path.join(UPLOADS_BASE, 'colectivos', String(colectivoId));
  await ensureDir(dir);

  if (!limits.images.allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`Tipo de imagen no permitido: ${file.mimetype}`);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const target = path.join(dir, `logo${ext}`);
  await removeByPrefix(dir, 'logo');
  await fs.copyFile(file.path, target);

  return {
    filePath: toPublic(target),
    mimeType: file.mimetype,
    fileSize: file.size,
  };
}

// ────────────────────────────────────────────────────────────
// Optimización de imágenes
// ────────────────────────────────────────────────────────────

async function optimizeImage(publicPath) {
  if (!limits.images.optimize) {
    return { filePath: publicPath, mimeType: 'unknown', fileSize: 0 };
  }

  const absolute = toAbsolute(publicPath);
  const ext = path.extname(absolute).toLowerCase();

  // GIFs: no tocar (preserva animación)
  if (ext === '.gif') {
    const stat = await fs.stat(absolute);
    return { filePath: publicPath, mimeType: 'image/gif', fileSize: stat.size };
  }

  if (!OPTIMIZABLE_EXTENSIONS.has(ext)) {
    const stat = await fs.stat(absolute);
    return { filePath: publicPath, mimeType: 'unknown', fileSize: stat.size };
  }

  const parsedPath = path.parse(absolute);
  const newAbsolute = path.join(parsedPath.dir, `${parsedPath.name}.webp`);
  const tmpAbsolute = `${newAbsolute}.tmp`;

  try {
    await sharp(absolute)
      .resize(limits.images.maxWidthPx, limits.images.maxHeightPx, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: limits.images.webpQuality })
      .toFile(tmpAbsolute);

    await fs.rename(tmpAbsolute, newAbsolute);

    // Si la extensión cambió (jpg → webp), borrar el original
    if (newAbsolute !== absolute) {
      await fs.unlink(absolute).catch(() => {});
    }

    const stat = await fs.stat(newAbsolute);

    return {
      filePath: toPublic(newAbsolute),
      mimeType: 'image/webp',
      fileSize: stat.size,
    };
  } catch (err) {
    await fs.unlink(tmpAbsolute).catch(() => {});
    throw new Error(`Error optimizando imagen ${publicPath}: ${err.message}`);
  }
}

// ────────────────────────────────────────────────────────────
// Borrado
// ────────────────────────────────────────────────────────────

async function deleteFile(publicPath) {
  if (!publicPath) return;
  try {
    const absolute = toAbsolute(publicPath);
    await fs.unlink(absolute);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`Error borrando ${publicPath}:`, err.message);
    }
  }
}

async function deleteEntityDir(entityType, entityId) {
  const dir = entityDir(entityType, entityId);
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`Error borrando ${dir}:`, err.message);
  }
}

async function deleteTempFile(tmpPath) {
  if (!tmpPath) return;
  await fs.unlink(tmpPath).catch(() => {});
}

/**
 * Borra varios ficheros temporales de una vez (silencioso).
 * El worker lo llama al terminar con éxito.
 */
async function cleanupTemps(paths) {
  if (!Array.isArray(paths)) return;
  await Promise.all(paths.map((p) => fs.unlink(p).catch(() => {})));
}

// ────────────────────────────────────────────────────────────
// API pública
// ────────────────────────────────────────────────────────────

module.exports = {
  saveFeatured,
  saveGalleryImage,
  saveDocument,
  saveLogo,
  optimizeImage,
  deleteFile,
  deleteEntityDir,
  deleteTempFile,
  cleanupTemps,
  toAbsolute,
  toPublic,
  sanitizeSlug,
  UPLOADS_BASE,
  TMP_DIR,
};
