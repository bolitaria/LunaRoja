const WorkingGroup = require('../models/WorkingGroup');
const classifyRegion = require('../utils/regionClassifier');

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await WorkingGroup.findAll({ 
      where: { isActive: true },
      order: [['regionCategory', 'ASC'], ['name', 'ASC']]
    });
    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener grupos' });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await WorkingGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener grupo' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    let { name, description, platform, link, region } = req.body;
    if (!name || !link) {
      return res.status(400).json({ message: 'Nombre y enlace son requeridos' });
    }
    if (description === '') description = null;
    if (region === '') region = null;

    const regionCategory = classifyRegion(region);

    const group = await WorkingGroup.create({ 
      name, 
      description, 
      platform: platform || 'telegram', 
      link, 
      region,
      regionCategory,
      isActive: true
    });
    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear grupo' });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await WorkingGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    let { name, description, platform, link, region, isActive } = req.body;
    if (description === '') description = null;
    if (region === '') region = null;

    const regionCategory = classifyRegion(region);

    await group.update({ 
      name, 
      description, 
      platform, 
      link, 
      region, 
      regionCategory,
      isActive 
    });
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar grupo' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await WorkingGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    await group.destroy();
    res.json({ message: 'Grupo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar grupo' });
  }
};