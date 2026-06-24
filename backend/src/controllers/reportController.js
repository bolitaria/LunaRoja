const Report = require('../models/Report');
const { isValidId, deleteFileSafe } = require('../utils/helpers');
const path = require('path');

const REPORTS_BASE = path.join(__dirname, '../../uploads/reports');

exports.getAllReports = async (req, res) => {
  try {
    // La ruta ya exige auth y superadmin, así que no repetimos la verificación
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
    const { title, description, content } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Título es requerido' });
    }

    // Al menos uno de los dos: archivo o contenido enriquecido
    if (!req.file && !content) {
      return res.status(400).json({
        message: 'Debes adjuntar un archivo o escribir el contenido del reporte'
      });
    }

    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/reports/${req.file.filename}`;
    }

    const report = await Report.create({
      title,
      description: description || '',
      content: content || '',
      fileUrl,
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

    const { title, description } = req.body;
    let fileUrl = report.fileUrl;

    if (req.file) {
      if (report.fileUrl) {
        deleteFileSafe(report.fileUrl, REPORTS_BASE);
      }
      fileUrl = `/uploads/reports/${req.file.filename}`;
    }

    await report.update({
      title: title || report.title,
      description: description !== undefined ? description : report.description,
      fileUrl,
    });
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