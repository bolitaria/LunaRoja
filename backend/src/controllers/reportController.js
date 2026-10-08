// backend/src/controllers/reportController.js
const { Op } = require('sequelize');
const Report = require('../models/Report');
const { toInt, isValidId } = require('../utils/helpers');
const { logAdminAction } = require('../services/auditService');
const cacheMiddleware = require('../middlewares/cache');
const { getQueue } = require('../services/queueService');
const documentService = require('../services/documentService');
const limits = require('../config/limits');

function collectUploadedFiles(req) {
  const files = req.files || [];
  const result = { featuredImage: null, images: [], documents: [] };

  const docNames = {};
  const docIsPublic = {};
  Object.keys(req.body).forEach((key) => {
    const matchName = key.match(/documents\[(\d+)\]\[name\]/);
    if (matchName) docNames[parseInt(matchName[1], 10)] = req.body[key];
    const matchPublic = key.match(/documents\[(\d+)\]\[isPublic\]/);
    if (matchPublic) docIsPublic[parseInt(matchPublic[1], 10)] = req.body[key] === 'true';
  });

  files.forEach((file) => {
    if (file.fieldname === 'featuredImage' || file.fieldname === 'image') {
      result.featuredImage = file;
    } else if (file.fieldname === 'images' || file.fieldname === 'images[]') {
      result.images.push(file);
    } else if (file.fieldname && file.fieldname.startsWith('documents[')) {
      const match = file.fieldname.match(/documents\[(\d+)\]\[file\]/);
      if (match) {
        const idx = parseInt(match[1], 10);
        result.documents.push({
          file,
          name: docNames[idx] || file.originalname,
          visibility: docIsPublic[idx] ? 'public' : 'admin',
        });
      }
    }
  });

  return result;
}

function serializeFile(file) {
  if (!file) return null;
  return {
    path: file.path,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
}

/**
 * Valida el body de un report según las reglas de negocio:
 *  - type='blog'   → author obligatorio
 *  - type='report' → bibliography obligatoria (min 1, max 5)
 *  - content y Document son mutuamente excluyentes
 *  - bibliography: array de { url (obligatoria), source? (opcional) }
 */
function validateReportInput({ type, author, bibliography, content, hasFile }) {
  const errors = [];

  if (type === 'blog') {
    if (!author || String(author).trim() === '') {
      errors.push('Los blogs deben tener firma (author)');
    }
  } else if (type === 'report') {
    if (!Array.isArray(bibliography) || bibliography.length === 0) {
      errors.push('Los reportes deben tener al menos una fuente bibliográfica');
    } else if (bibliography.length > limits.reports.maxBibliographyEntries) {
      errors.push(`Máximo ${limits.reports.maxBibliographyEntries} fuentes bibliográficas por reporte`);
    } else {
      for (let i = 0; i < bibliography.length; i++) {
        const entry = bibliography[i];
        if (!entry || typeof entry !== 'object' || typeof entry.url !== 'string' || entry.url.trim() === '') {
          errors.push(`bibliography[${i}] debe tener una url válida`);
        }
      }
    }
  }

  const hasContent = content !== undefined && content !== null && String(content).trim() !== '';
  if (hasContent && hasFile) {
    errors.push('Un reporte no puede tener contenido textual y documento subido a la vez');
  }
  if (!hasContent && !hasFile) {
    errors.push('Un reporte debe tener contenido textual o documento subido');
  }

  return errors;
}

exports.getAllReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      type,
      source,
      author,
      hasFileUrl,
      dateFrom,
      dateTo,
      sortBy = 'publishedAt',
      sortOrder = 'DESC',
    } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (type) where.type = type;
    if (source) where.source = { [Op.iLike]: `%${source}%` };
    if (author) where.author = { [Op.iLike]: `%${author}%` };

    if (hasFileUrl === 'true') where.fileUrl = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };
    else if (hasFileUrl === 'false') where.fileUrl = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] };

    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) dateFilter[Op.gte] = new Date(dateFrom);
      if (dateTo) dateFilter[Op.lte] = new Date(dateTo + 'T23:59:59');
      where.publishedAt = dateFilter;
    }

    const parsedPage = Math.max(1, parseInt(page) || 1);
    let parsedLimit = parseInt(limit) || 12;
    if (parsedLimit < 1) parsedLimit = 1;
    if (parsedLimit > 100) parsedLimit = 100;
    const offset = (parsedPage - 1) * parsedLimit;

    const orderField = ['publishedAt', 'createdAt', 'title'].includes(sortBy) ? sortBy : 'publishedAt';
    const orderDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [total, rows, blogs, reports, withFile] = await Promise.all([
      Report.count({ where }),
      Report.findAll({
        where,
        limit: parsedLimit,
        offset,
        order: [[orderField, orderDir]],
      }),
      Report.count({ where: { ...where, type: 'blog' } }),
      Report.count({ where: { ...where, type: 'report' } }),
      Report.count({ where: { ...where, fileUrl: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } } }),
    ]);

    res.json({
      data: rows,
      total,
      page: parsedPage,
      limit: parsedLimit,
      metrics: { total, blogs, reports, withFile },
    });
  } catch (error) {
    console.error('Error en getAllReports:', error);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const report = await Report.findByPk(id);
    if (!report) return res.status(404).json({ message: 'Reporte no encontrado' });

    const isAdmin = req.user && ['superadmin', 'campaign_admin', 'blog_admin'].includes(req.user.role);
    const documents = await documentService.listFor({
      entityType: 'report',
      entityId: id,
      includeAdmin: isAdmin,
    });

    res.json({ ...report.toJSON(), documents });
  } catch (error) {
    console.error('Error en getReportById:', error);
    res.status(500).json({ message: 'Error al obtener reporte' });
  }
};

exports.createReport = async (req, res) => {
  try {
    let { title, description, content, type, source, author, publishedAt, bibliography } = req.body;
    if (!title) return res.status(400).json({ message: 'Título requerido' });

    if (type && !['blog', 'report'].includes(type)) {
      return res.status(400).json({ message: 'Tipo inválido (blog | report)' });
    }

    // Normalizar bibliography (JSON o string)
    if (typeof bibliography === 'string') {
      try { bibliography = JSON.parse(bibliography); } catch (e) { bibliography = null; }
    }

    const uploaded = collectUploadedFiles(req);
    const hasFile = uploaded.documents.length > 0;

    const errors = validateReportInput({ type: type || 'blog', author, bibliography, content, hasFile });
    if (errors.length > 0) return res.status(400).json({ message: errors.join('; ') });

    const report = await Report.create({
      title,
      description: description || '',
      content: hasFile ? null : (content || ''),
      fileUrl: null,
      type: type || 'blog',
      source: source || null,
      author: author || null,
      publishedAt: publishedAt || new Date(),
      bibliography: type === 'report' ? bibliography : null,
    });

    // Si hay fichero → encolar procesamiento
    if (hasFile) {
      await getQueue('entity-post-process').add(
        'process-entity',
        {
          entityType: 'report',
          entityId: report.id,
          userId: req.user.id,
          featuredImage: null,
          galleryImages: [],
          documents: uploaded.documents.map((d) => ({
            ...serializeFile(d.file),
            name: d.name,
            visibility: d.visibility,
          })),
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 },
          removeOnComplete: true,
          removeOnFail: { age: 86400 },
        }
      );
    }

    await cacheMiddleware.invalidateResource('reports', report.id);

    await logAdminAction(req, {
      action: 'create',
      entityType: 'report',
      entityId: report.id,
      metadata: { title: report.title, type: report.type, hasFile },
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error en createReport:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: 'Error al crear reporte' });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const report = await Report.findByPk(id);
    if (!report) return res.status(404).json({ message: 'Reporte no encontrado' });

    let { title, description, content, type, source, author, publishedAt, bibliography } = req.body;

    if (typeof bibliography === 'string') {
      try { bibliography = JSON.parse(bibliography); } catch (e) { bibliography = undefined; }
    }

    const newType = type !== undefined ? type : report.type;
    const newAuthor = author !== undefined ? author : report.author;
    const newBibliography = bibliography !== undefined ? bibliography : report.bibliography;

    const uploaded = collectUploadedFiles(req);
    const hasFileUpload = uploaded.documents.length > 0;
    const existingDocs = await documentService.listFor({ entityType: 'report', entityId: report.id, includeAdmin: true });
    const hasFile = hasFileUpload || existingDocs.length > 0;

    const newContent = content !== undefined ? content : report.content;

    const errors = validateReportInput({
      type: newType,
      author: newAuthor,
      bibliography: newBibliography,
      content: newContent,
      hasFile,
    });
    if (errors.length > 0) return res.status(400).json({ message: errors.join('; ') });

    await report.update({
      title: title !== undefined ? title : report.title,
      description: description !== undefined ? description : report.description,
      content: content !== undefined ? content : report.content,
      type: newType,
      source: source !== undefined ? source : report.source,
      author: newAuthor,
      publishedAt: publishedAt !== undefined ? publishedAt : report.publishedAt,
      bibliography: newType === 'report' ? newBibliography : null,
    });

    if (hasFileUpload) {
      await getQueue('entity-post-process').add(
        'process-entity',
        {
          entityType: 'report',
          entityId: report.id,
          userId: req.user.id,
          featuredImage: null,
          galleryImages: [],
          documents: uploaded.documents.map((d) => ({
            ...serializeFile(d.file),
            name: d.name,
            visibility: d.visibility,
          })),
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 },
          removeOnComplete: true,
          removeOnFail: { age: 86400 },
        }
      );
    }

    await cacheMiddleware.invalidateResource('reports', id);

    await logAdminAction(req, {
      action: 'update',
      entityType: 'report',
      entityId: id,
      metadata: { changed: Object.keys(req.body) },
    });

    res.json(report);
  } catch (error) {
    console.error('Error en updateReport:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: 'Error al actualizar reporte' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID inválido' });
    const report = await Report.findByPk(id);
    if (!report) return res.status(404).json({ message: 'Reporte no encontrado' });

    const snapshot = { title: report.title, type: report.type };

    const storage = require('../services/storageService');
    await storage.deleteEntityDir('report', report.id);
    await documentService.deleteAllFor('report', report.id);

    await report.destroy();

    await cacheMiddleware.invalidateResource('reports', id);

    await logAdminAction(req, {
      action: 'delete',
      entityType: 'report',
      entityId: id,
      metadata: snapshot,
    });

    res.json({ message: 'Reporte eliminado' });
  } catch (error) {
    console.error('Error en deleteReport:', error);
    res.status(500).json({ message: 'Error al eliminar reporte' });
  }
};
