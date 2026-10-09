const { Link } = require('../models');
const createError = require('http-errors');

const VALID_REGIONS = [
  'norteamerica',
  'america_latina',
  'africa',
  'asia_occidental',
  'asia_meridional_oriental',
  'oceania',
];

function sanitizeRegion(category, region) {
  if (category !== 'internacional') return null;
  if (!region || region === '') return null;
  return VALID_REGIONS.includes(region) ? region : null;
}

// CRUD para administradores

exports.listLinks = async (req, res, next) => {
  try {
    const links = await Link.findAll({ order: [['created_at', 'DESC']] });
    res.json(links);
  } catch (err) { next(err); }
};

exports.createLink = async (req, res, next) => {
  try {
    const { title, url, description, category, region } = req.body;
    if (!title || !url || !category) {
      throw createError(400, 'Título, URL y categoría son obligatorios');
    }
    const link = await Link.create({
      title,
      url,
      description,
      category,
      region: sanitizeRegion(category, region),
      created_by: req.user.id,
    });
    res.status(201).json(link);
  } catch (err) { next(err); }
};

exports.updateLink = async (req, res, next) => {
  try {
    const link = await Link.findByPk(req.params.id);
    if (!link) throw createError(404, 'Enlace no encontrado');

    const { title, url, description, category, region, active } = req.body;
    const finalCategory = category !== undefined ? category : link.category;

    await link.update({
      title: title !== undefined ? title : link.title,
      url: url !== undefined ? url : link.url,
      description: description !== undefined ? description : link.description,
      category: finalCategory,
      region: region !== undefined
        ? sanitizeRegion(finalCategory, region)
        : (finalCategory !== 'internacional' ? null : link.region),
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
// Para 'internacional' además agrupamos por región.
exports.publicLinks = async (req, res, next) => {
  try {
    const links = await Link.findAll({
      where: { active: true },
      order: [['created_at', 'DESC']],
    });

    const flat = {
      local: [],
      nacional: [],
      europeo: [],
      internacional: [],
      literatura: [],
      bibliografia: [],
    };

    // Sub-grupo de internacional por región
    const byRegion = {
      norteamerica: [],
      america_latina: [],
      africa: [],
      asia_occidental: [],
      asia_meridional_oriental: [],
      oceania: [],
      sin_region: [],
    };

    links.forEach(link => {
      const cat = link.category;
      if (flat[cat]) flat[cat].push(link);

      if (cat === 'internacional') {
        const r = link.region && byRegion[link.region] ? link.region : 'sin_region';
        byRegion[r].push(link);
      }
    });

    res.json({
      ...flat,
      // Las subregiones solo se exponen dentro de internacional
      internacionalByRegion: byRegion,
    });
  } catch (err) { next(err); }
};
