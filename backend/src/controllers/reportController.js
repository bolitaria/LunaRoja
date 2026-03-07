const Report = require('../models/Report');
const fs = require('fs');
const path = require('path');

// Obtener todos los reportes (público)
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.findAll({ order: [['publishedAt', 'DESC']] });
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
};

// Obtener un reporte por ID (público)
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener reporte' });
  }
};

// Crear un nuevo reporte (admin) con subida de archivo
exports.createReport = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Título es requerido' });
    }

    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/reports/${req.file.filename}`;
    }

    const report = await Report.create({ title, description, fileUrl });
    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear reporte' });
  }
};

// Actualizar un reporte (admin)
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    const { title, description } = req.body;
    let fileUrl = report.fileUrl;

    // Si se sube un nuevo archivo, eliminar el anterior y actualizar URL
    if (req.file) {
      // Eliminar archivo anterior si existe
      if (report.fileUrl) {
        const oldPath = path.join(__dirname, '../../uploads/reports', path.basename(report.fileUrl));
        fs.unlink(oldPath, (err) => {
          if (err) console.error('Error al eliminar archivo anterior:', err);
        });
      }
      fileUrl = `/uploads/reports/${req.file.filename}`;
    }

    await report.update({ title, description, fileUrl });
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar reporte' });
  }
};

// Eliminar un reporte (admin)
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    // Eliminar archivo físico si existe
    if (report.fileUrl) {
      const filePath = path.join(__dirname, '../../uploads/reports', path.basename(report.fileUrl));
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error al eliminar archivo:', err);
      });
    }

    await report.destroy();
    res.json({ message: 'Reporte eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar reporte' });
  }
};