const ActionImage = require('../models/ActionImage');
const Report = require('../models/Report');
const fs = require('fs');
const path = require('path');

// Obtener todas las imágenes de acciones y reportes
exports.getAllImages = async (req, res) => {
  try {
    // Imágenes de acciones
    const actionImages = await ActionImage.findAll({
      include: [{ model: require('../models/Action'), as: 'action', attributes: ['title'] }],
      order: [['createdAt', 'DESC']]
    });

    // También podríamos incluir imágenes de reportes si se desea (no hay modelo separado, pero se puede obtener de los reportes)
    const reports = await Report.findAll({
      attributes: ['id', 'title', 'fileUrl', 'createdAt']
    });
    const reportFiles = reports
      .filter(r => r.fileUrl && r.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i))
      .map(r => ({
        id: `report-${r.id}`,
        url: r.fileUrl,
        relatedId: r.id,
        relatedType: 'report',
        relatedTitle: r.title,
        createdAt: r.createdAt
      }));

    const allImages = [
      ...actionImages.map(img => ({
        id: img.id,
        url: img.url,
        relatedId: img.actionId,
        relatedType: 'action',
        relatedTitle: img.action ? img.action.title : 'Acción',
        createdAt: img.createdAt
      })),
      ...reportFiles
    ];

    res.json(allImages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener imágenes' });
  }
};

// Eliminar una imagen (ya sea de ActionImage o archivo de reporte)
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    // Intentar como ActionImage
    const actionImage = await ActionImage.findByPk(id);
    if (actionImage) {
      const filePath = path.join(__dirname, '../../uploads/actions', path.basename(actionImage.url));
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error al eliminar archivo:', err);
      });
      await actionImage.destroy();
      return res.json({ message: 'Imagen de acción eliminada' });
    }

    // Si no, podría ser un reporte (id empieza con "report-")
    if (typeof id === 'string' && id.startsWith('report-')) {
      const reportId = parseInt(id.split('-')[1]);
      const report = await Report.findByPk(reportId);
      if (report && report.fileUrl) {
        const filePath = path.join(__dirname, '../../uploads/reports', path.basename(report.fileUrl));
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error al eliminar archivo:', err);
        });
        // No eliminamos el reporte, solo el archivo
        await report.update({ fileUrl: null });
        return res.json({ message: 'Archivo de reporte eliminado' });
      }
    }

    res.status(404).json({ message: 'Imagen no encontrada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar imagen' });
  }
};