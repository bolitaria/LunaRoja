const Action = require('../models/Action');

// GET /api/actions (público) - acepta query ?status=
exports.getAllActions = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    const actions = await Action.findAll({ where, order: [['date', 'DESC']] });
    res.json(actions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener acciones' });
  }
};

// GET /api/actions/:id
exports.getActionById = async (req, res) => {
  try {
    const action = await Action.findByPk(req.params.id);
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });
    res.json(action);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener acción' });
  }
};

// POST /api/actions (admin)
exports.createAction = async (req, res) => {
  try {
    const { title, description, status, date, imageUrl, link } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: 'Título y fecha son requeridos' });
    }
    const action = await Action.create({ title, description, status, date, imageUrl, link });
    res.status(201).json(action);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear acción' });
  }
};

// PUT /api/actions/:id (admin)
exports.updateAction = async (req, res) => {
  try {
    const action = await Action.findByPk(req.params.id);
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    const { title, description, status, date, imageUrl, link } = req.body;
    await action.update({ title, description, status, date, imageUrl, link });
    res.json(action);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar acción' });
  }
};

// DELETE /api/actions/:id (admin)
exports.deleteAction = async (req, res) => {
  try {
    const action = await Action.findByPk(req.params.id);
    if (!action) return res.status(404).json({ message: 'Acción no encontrada' });

    await action.destroy();
    res.json({ message: 'Acción eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar acción' });
  }
};