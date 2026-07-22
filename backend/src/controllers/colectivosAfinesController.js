const fs = require('fs').promises;
const path = require('path');
const { ColectivoAfines } = require('../models');  // ← agregué 'require' aquí


const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'colectivos');
const PUBLIC_URL_PREFIX = '/uploads/colectivos';

const ensureDir = async (dir) => {
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
};

// Obtener todos
const getAll = async (req, res) => {
  try {
    const registros = await ColectivoAfines.findAll({ order: [['createdAt', 'DESC']] });
    const data = registros.map(item => ({
      id: item.id,
      nombre: item.nombre,
      url: item.imagen,
      link: item.link || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Error en getAll colectivos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los colectivos afines' });
  }
};

// Obtener por ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const registro = await ColectivoAfines.findByPk(id);
    if (!registro) return res.status(404).json({ success: false, message: 'Colectivo no encontrado' });
    res.status(200).json({
      success: true,
      data: {
        id: registro.id,
        nombre: registro.nombre,
        url: registro.imagen,
        link: registro.link || null,
      },
    });
  } catch (error) {
    console.error('Error en getById colectivo:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el colectivo' });
  }
};

// Crear nuevo (NOMBRE OPCIONAL)
const create = async (req, res) => {
  try {
    const { nombre, link } = req.body;
    // Solo validamos link e imagen; el nombre es opcional
    if (!link || !link.trim()) {
      return res.status(400).json({ success: false, message: 'El enlace (URL) es obligatorio' });
    }
    let imagenRuta = null;
    if (req.file) {
      await ensureDir(UPLOADS_DIR);
      imagenRuta = `${PUBLIC_URL_PREFIX}/${req.file.filename}`;
    } else {
      return res.status(400).json({ success: false, message: 'La imagen es obligatoria' });
    }
    const nuevo = await ColectivoAfines.create({
      nombre: nombre?.trim() || null,   // ← opcional: guarda null si no se envía o está vacío
      imagen: imagenRuta,
      link: link.trim(),
    });
    res.status(201).json({
      success: true,
      message: 'Colectivo creado correctamente',
      data: {
        id: nuevo.id,
        nombre: nuevo.nombre,
        url: nuevo.imagen,
        link: nuevo.link,
      },
    });
  } catch (error) {
    console.error('Error en create colectivo:', error);
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch {}
    }
    res.status(500).json({ success: false, message: 'Error al crear el colectivo' });
  }
};

// Actualizar (NOMBRE OPCIONAL)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, link } = req.body;
    const registro = await ColectivoAfines.findByPk(id);
    if (!registro) return res.status(404).json({ success: false, message: 'Colectivo no encontrado' });

    // Si se envía nombre (incluso vacío), lo guardamos como null si es vacío
    if (nombre !== undefined) registro.nombre = nombre?.trim() || null;
    // Si se envía link (incluso vacío), mantenemos el anterior si no es válido
    if (link !== undefined) registro.link = link.trim() || registro.link;

    if (req.file) {
      if (registro.imagen) {
        const oldPath = path.join(__dirname, '..', registro.imagen.replace(/^\//, ''));
        try { await fs.unlink(oldPath); } catch {}
      }
      await ensureDir(UPLOADS_DIR);
      registro.imagen = `${PUBLIC_URL_PREFIX}/${req.file.filename}`;
    }
    await registro.save();
    res.status(200).json({
      success: true,
      message: 'Colectivo actualizado correctamente',
      data: {
        id: registro.id,
        nombre: registro.nombre,
        url: registro.imagen,
        link: registro.link,
      },
    });
  } catch (error) {
    console.error('Error en update colectivo:', error);
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch {}
    }
    res.status(500).json({ success: false, message: 'Error al actualizar el colectivo' });
  }
};

// Eliminar
const deleteColectivo = async (req, res) => {
  try {
    const { id } = req.params;
    const registro = await ColectivoAfines.findByPk(id);
    if (!registro) return res.status(404).json({ success: false, message: 'Colectivo no encontrado' });
    if (registro.imagen) {
      const filePath = path.join(__dirname, '..', registro.imagen.replace(/^\//, ''));
      try { await fs.unlink(filePath); } catch {}
    }
    await registro.destroy();
    res.status(200).json({ success: true, message: 'Colectivo eliminado correctamente' });
  } catch (error) {
    console.error('Error en delete colectivo:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el colectivo' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteColectivo,
  deleteColectivo,
};