const WorkingGroup = require('../models/WorkingGroup');

// GET /api/working-groups (público) - solo activos
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await WorkingGroup.findAll({ where: { isActive: true } });
    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener grupos' });
  }
};

// GET /api/working-groups/:id
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

// POST /api/working-groups (admin)
exports.createGroup = async (req, res) => {
  try {
    const { name, description, telegramLink } = req.body;
    if (!name || !telegramLink) {
      return res.status(400).json({ message: 'Nombre y enlace de Telegram son requeridos' });
    }
    const group = await WorkingGroup.create({ name, description, telegramLink });
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

    const { name, description, telegramLink, isActive } = req.body;
    await group.update({ name, description, telegramLink, isActive });
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