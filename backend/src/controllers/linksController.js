const { Link } = require('../models');
const createError = require('http-errors');

// CRUD para administradores

exports.listLinks = async (req, res, next) => {
  try {
    const links = await Link.findAll({ order: [['created_at', 'DESC']] });
    res.json(links);
  } catch (err) { next(err); }
};

exports.createLink = async (req, res, next) => {
  try {
    const { title, url, description, category } = req.body;
    if (!title || !url || !category) {
      throw createError(400, 'Título, URL y categoría son obligatorios');
    }
    const link = await Link.create({
      title,
      url,
      description,
      category,
      created_by: req.user.id,
    });
    res.status(201).json(link);
  } catch (err) { next(err); }
};

exports.updateLink = async (req, res, next) => {
  try {
    const link = await Link.findByPk(req.params.id);
    if (!link) throw createError(404, 'Enlace no encontrado');

    const { title, url, description, category, active } = req.body;
    await link.update({
      title: title !== undefined ? title : link.title,
      url: url !== undefined ? url : link.url,
      description: description !== undefined ? description : link.description,
      category: category !== undefined ? category : link.category,
      active: active !== undefined ? active : link.active,
    });
    res.json(link);
  } catch (err) { next(err); }
};

exports.deleteLink = async (req, res, next) => {
  try {
    const link = await Link.findByPk(req.params.id);
    if (!link) throw createError(404, 'Enlace no encontrado');
    await link.destroy();
    res.json({ message: 'Enlace eliminado' });
  } catch (err) { next(err); }
};

// Ruta pública: enlaces activos agrupados por categoría
exports.publicLinks = async (req, res, next) => {
  try {
    const links = await Link.findAll({
      where: { active: true },
      order: [['created_at', 'DESC']],
    });

    const grouped = {
      local: [],
      nacional: [],
      europeo: [],
      internacional: [],
      literatura: [],
    };

    links.forEach(link => {
      if (grouped[link.category]) {
        grouped[link.category].push(link);
      }
    });

    res.json(grouped);
  } catch (err) { next(err); }
};