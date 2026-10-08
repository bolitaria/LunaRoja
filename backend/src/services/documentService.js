/**
 * ============================================================
 * DocumentService
 * ============================================================
 * Servicio único para el CRUD de la tabla `Documents`.
 *
 * Responsabilidades:
 *  - Procesar el FormData de documentos: `documents[N][name]`,
 *    `documents[N][source]`, `documents[N][file]`, `documents[N][externalUrl]`,
 *    `documents[N][visibility]`.
 *  - Validar límites (5 públicos, 5 admin, 1 link) desde `config/limits.js`.
 *  - Guardar ficheros vía `storageService`.
 *  - Crear filas en `Documents`.
 *  - Listar por entidad (filtrando por visibilidad según rol).
 *  - Borrar (con check de scope + borrado del fichero físico).
 *
 * Convención de FormData:
 *   documents[0][name]        → título (obligatorio)
 *   documents[0][description] → descripción (opcional)
 *   documents[0][source]      → 'upload' (default) | 'link'
 *   documents[0][file]        → fichero (solo si source='upload')
 *   documents[0][externalUrl] → URL (solo si source='link')
 *   documents[0][visibility]  → 'public' | 'admin' (default 'admin')
 *                                Si source='link' → forzado a 'admin'
 *
 * Nota: los documentos existentes NO se modifican desde aquí. Se gestionan
 * con endpoints propios: DELETE /api/documents/:id.
 * Este servicio solo CREA nuevos a partir de un formulario.
 */

const Document = require('../models/Document');
const storage = require('./storageService');
const limits = require('../config/limits');

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

const ENTITY_FK = {
  action:   'actionId',
  campaign: 'campaignId',
  bds:      'bdsId',
  report:   'reportId',
};

function fkFor(entityType) {
  const fk = ENTITY_FK[entityType];
  if (!fk) throw new Error(`entityType inválido: "${entityType}"`);
  return fk;
}

function toBool(v) {
  return v === true || v === 'true' || v === 'on' || v === 1 || v === '1';
}

function toInt(v) {
  const n = parseInt(v, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Parsea el FormData en un array de entradas de documento.
 * Devuelve [{ idx, name, description, source, visibility, externalUrl, file }]
 * donde `file` es el objeto multer (solo si source='upload' y hay fichero).
 */
function parseDocumentEntries(files = [], body = {}) {
  const map = new Map();  // idx → entry parcial

  // 1. Extraer los campos de texto por índice
  const keyRe = /^documents\[(\d+)\]\[(\w+)\]$/;
  for (const [key, value] of Object.entries(body)) {
    const m = key.match(keyRe);
    if (!m) continue;
    const idx = parseInt(m[1], 10);
    const field = m[2];
    if (!map.has(idx)) map.set(idx, { idx });
    map.get(idx)[field] = value;
  }

  // 2. Asociar los ficheros subidos por multer
  for (const file of files) {
    const m = file.fieldname && file.fieldname.match(/^documents\[(\d+)\]\[file\]$/);
    if (!m) continue;
    const idx = parseInt(m[1], 10);
    if (!map.has(idx)) map.set(idx, { idx });
    map.get(idx).file = file;
  }

  // 3. Normalizar cada entrada
  const entries = [];
  for (const [idx, raw] of [...map.entries()].sort((a, b) => a[0] - b[0])) {
    const source = raw.source === 'link' ? 'link' : 'upload';
    let visibility = raw.visibility === 'public' ? 'public' : 'admin';
    // Regla: los links siempre son admin
    if (source === 'link') visibility = 'admin';

    const entry = {
      idx,
      name: String(raw.name || '').trim(),
      description: raw.description ? String(raw.description).trim() : null,
      source,
      visibility,
      externalUrl: raw.externalUrl ? String(raw.externalUrl).trim() : null,
      file: raw.file || null,
    };

    // Validaciones por entrada
    if (!entry.name) {
      throw new Error(`documents[${idx}]: el título es obligatorio`);
    }
    if (source === 'upload' && !entry.file) {
      throw new Error(`documents[${idx}]: falta el fichero (source=upload)`);
    }
    if (source === 'link' && !entry.externalUrl) {
      throw new Error(`documents[${idx}]: falta externalUrl (source=link)`);
    }
    if (source === 'link' && !/^https?:\/\/.+/.test(entry.externalUrl)) {
      throw new Error(`documents[${idx}]: externalUrl debe ser una URL http(s)`);
    }

    entries.push(entry);
  }

  return entries;
}

/**
 * Cuenta los documentos de una entidad por visibilidad y source.
 * Los links cuentan como `admin` y como `link` separadamente.
 */
async function countFor(entityType, entityId) {
  const fk = fkFor(entityType);
  const where = { [fk]: entityId };

  const [publicUploads, adminUploads, links] = await Promise.all([
    Document.count({ where: { ...where, source: 'upload', visibility: 'public' } }),
    Document.count({ where: { ...where, source: 'upload', visibility: 'admin' } }),
    Document.count({ where: { ...where, source: 'link' } }),
  ]);

  return { publicUploads, adminUploads, links };
}

/**
 * Valida que añadir `entries` no supera los límites por entidad.
 */
async function validateLimits(entityType, entityId, entries) {
  const { publicUploads, adminUploads, links } = await countFor(entityType, entityId);

  const adding = {
    publicUploads: entries.filter((e) => e.source === 'upload' && e.visibility === 'public').length,
    adminUploads:  entries.filter((e) => e.source === 'upload' && e.visibility === 'admin').length,
    links:         entries.filter((e) => e.source === 'link').length,
  };

  if (publicUploads + adding.publicUploads > limits.documents.maxPublicUploadsPerEntity) {
    throw new Error(
      `Máximo ${limits.documents.maxPublicUploadsPerEntity} documentos públicos por entidad ` +
      `(actuales: ${publicUploads}, intentando añadir: ${adding.publicUploads})`
    );
  }
  if (adminUploads + adding.adminUploads > limits.documents.maxAdminUploadsPerEntity) {
    throw new Error(
      `Máximo ${limits.documents.maxAdminUploadsPerEntity} documentos privados por entidad ` +
      `(actuales: ${adminUploads}, intentando añadir: ${adding.adminUploads})`
    );
  }
  if (links + adding.links > limits.documents.maxExternalLinksPerEntity) {
    throw new Error(
      `Máximo ${limits.documents.maxExternalLinksPerEntity} enlace(s) externo(s) por entidad ` +
      `(actuales: ${links}, intentando añadir: ${adding.links})`
    );
  }

  // Regla especial para report: máx 1 documento en total (upload + link)
  if (entityType === 'report') {
    const totalExisting = publicUploads + adminUploads + links;
    const totalAdding = entries.length;
    if (totalExisting + totalAdding > limits.reports.maxDocumentsPerReport) {
      throw new Error(
        `Máximo ${limits.reports.maxDocumentsPerReport} documento(s) por reporte`
      );
    }
  }
}

// ────────────────────────────────────────────────────────────
// API principal
// ────────────────────────────────────────────────────────────

/**
 * Procesa los documentos del FormData y crea filas en `Documents`.
 *
 * @param {object} params
 * @param {Array}  params.files       - req.files (multer)
 * @param {object} params.body        - req.body
 * @param {string} params.entityType  - 'action'|'campaign'|'bds'|'report'
 * @param {number} params.entityId
 * @param {number} params.userId      - uploadedBy (opcional)
 * @returns {Promise<Array>}          - Array de Document creados
 */
async function createFromRequest({ files, body, entityType, entityId, userId }) {
  const entries = parseDocumentEntries(files, body);
  if (entries.length === 0) return [];

  await validateLimits(entityType, entityId, entries);

  const fk = fkFor(entityType);
  const created = [];

  for (const entry of entries) {
    let filePath = null;
    let externalUrl = null;
    let mimeType = null;
    let fileSize = null;

    if (entry.source === 'upload') {
      try {
        const saved = await storage.saveDocument(entityType, entityId, entry.file, entry.name);
        filePath = saved.filePath;
        mimeType = saved.mimeType;
        fileSize = saved.fileSize;
      } catch (err) {
        // Limpiar temp file si falló
        await storage.deleteTempFile(entry.file.path);
        throw new Error(`documents[${entry.idx}]: ${err.message}`);
      }
    } else {
      externalUrl = entry.externalUrl;
    }

    try {
      const doc = await Document.create({
        title: entry.name,
        description: entry.description,
        source: entry.source,
        filePath,
        externalUrl,
        mimeType,
        fileSize,
        visibility: entry.visibility,
        [fk]: entityId,
        uploadedBy: userId || null,
      });
      created.push(doc);
    } catch (err) {
      // Rollback: borrar el fichero ya guardado
      if (filePath) await storage.deleteFile(filePath);
      throw err;
    }
  }

  return created;
}

/**
 * Lista los documentos de una entidad.
 *
 * @param {object} params
 * @param {string} params.entityType
 * @param {number} params.entityId
 * @param {boolean} params.includeAdmin  - true → incluye admin (para admins con scope)
 * @returns {Promise<Array>}
 */
async function listFor({ entityType, entityId, includeAdmin = false }) {
  const fk = fkFor(entityType);
  const where = { [fk]: entityId };
  if (!includeAdmin) {
    where.visibility = 'public';
  }
  return Document.findAll({
    where,
    order: [['createdAt', 'ASC']],
  });
}

/**
 * Borra un documento por ID (con check de scope en el controller).
 * Borra también el fichero físico si aplica.
 */
async function deleteById(docId) {
  const doc = await Document.findByPk(docId);
  if (!doc) return null;

  // Borrar fichero físico si es upload
  if (doc.source === 'upload' && doc.filePath) {
    await storage.deleteFile(doc.filePath);
  }

  await doc.destroy();
  return doc;
}

/**
 * Borra todos los documentos de una entidad (para hooks afterDestroy).
 * Borra también los ficheros físicos.
 */
async function deleteAllFor(entityType, entityId) {
  const fk = fkFor(entityType);
  const docs = await Document.findAll({ where: { [fk]: entityId } });

  for (const doc of docs) {
    if (doc.source === 'upload' && doc.filePath) {
      await storage.deleteFile(doc.filePath);
    }
  }

  await Document.destroy({ where: { [fk]: entityId } });
}

module.exports = {
  Document,  // expuesto para uso desde workers
  createFromRequest,
  listFor,
  deleteById,
  deleteAllFor,
  countFor,
  // Exportado para tests
  _parseDocumentEntries: parseDocumentEntries,
  _validateLimits: validateLimits,
};
