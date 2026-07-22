const Report = require('../models/Report');
const { isValidId, deleteFileSafe } = require('../utils/helpers');
const path = require('path');

const REPORTS_BASE = path.join(__dirname, '../../uploads/reports');

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.findAll({ order: [['publishedAt', 'DESC']] });
    res.json(reports);
  } catch (error) {
    console.error('Error en getAllReports:', error);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    res.json(report);
  } catch (error) {
    console.error('Error en getReportById:', error);
    res.status(500).json({ message: 'Error al obtener reporte' });
  }
};

exports.createReport = async (req, res) => {
  try {
    const { title, description, content, type, source, author } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'El título es obligatorio' });
    }

    // blog_admin solo puede crear blogs
    let finalType = type || 'blog';
    if (req.user && req.user.role === 'blog_admin') {
      finalType = 'blog';
    }

    // Validar fuente para reportes (solo si el usuario puede crear reportes)
    if (finalType === 'report' && (!source || source.trim() === '')) {
      return res.status(400).json({ message: 'Los reportes deben citar al menos una fuente oficial' });
    }

    // Validar contenido: se permite crear blog sin contenido ni archivo si tiene descripción
    const hasContent = content && content.trim() !== '';
    const hasFile = !!req.file;
    if (!hasContent && !hasFile) {
      if (finalType === 'blog' && description && description.trim() !== '') {
        // blog con solo descripción es válido
      } else {
        return res.status(400).json({
          message: 'Debes adjuntar un archivo, escribir contenido o (para blogs) incluir una descripción'
        });
      }
    }

    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/reports/${req.file.filename}`;
    }

    const report = await Report.create({
      title,
      description: description || '',
      content: content || '',
      type: finalType,
      source: source || '',
      author: author || '',
      fileUrl,
      userId: req.user ? req.user.id : null,  // opcional: trazabilidad del creador
    });
    res.status(201).json(report);
  } catch (error) {
    console.error('Error en createReport:', error);
    res.status(500).json({ message: 'Error al crear reporte' });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    // Solo superadmin y blog_admin pueden editar
    if (req.user.role !== 'superadmin' && req.user.role !== 'blog_admin') {
      return res.status(403).json({ message: 'No tienes permiso para editar esta entrada' });
    }

    // blog_admin solo puede editar blogs y no puede cambiar el tipo a report
    if (req.user.role === 'blog_admin') {
      if (report.type !== 'blog') {
        return res.status(403).json({ message: 'Solo puedes editar entradas de tipo blog' });
      }
      // si se envía type, debe ser 'blog'
      if (req.body.type && req.body.type !== 'blog') {
        return res.status(403).json({ message: 'No puedes cambiar el tipo a reporte' });
      }
    }

    const { title, description, content, type, source, author } = req.body;
    let fileUrl = report.fileUrl;

    // Si se sube un nuevo archivo, eliminar el anterior
    if (req.file) {
      if (report.fileUrl) {
        deleteFileSafe(report.fileUrl, REPORTS_BASE);
      }
      fileUrl = `/uploads/reports/${req.file.filename}`;
    }

    // Campos actualizables
    const updatedData = {
      title: title !== undefined ? title : report.title,
      description: description !== undefined ? description : report.description,
      content: content !== undefined ? content : report.content,
      type: type !== undefined ? (req.user.role === 'blog_admin' ? 'blog' : type) : report.type,
      source: source !== undefined ? source : report.source,
      author: author !== undefined ? author : report.author,
      fileUrl,
    };

    // Si el usuario es superadmin y cambia a report, validar fuente
    if (req.user.role === 'superadmin' && updatedData.type === 'report' && !updatedData.source) {
      return res.status(400).json({ message: 'Los reportes requieren al menos una fuente oficial' });
    }

    await report.update(updatedData);
    res.json(report);
  } catch (error) {
    console.error('Error en updateReport:', error);
    res.status(500).json({ message: 'Error al actualizar reporte' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    if (report.fileUrl) {
      deleteFileSafe(report.fileUrl, REPORTS_BASE);
    }

    await report.destroy();
    res.json({ message: 'Reporte eliminado correctamente' });
  } catch (error) {
    console.error('Error en deleteReport:', error);
    res.status(500).json({ message: 'Error al eliminar reporte' });
  }
};