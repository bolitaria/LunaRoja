const { ChatGroup } = require('../models');

exports.getAllGroups = async (req, res, next) => {
  try {
    const groups = await ChatGroup.findAll();
    res.json(groups);
  } catch (err) { next(err); }
};

exports.getGroupById = async (req, res, next) => {
  try {
    const group = await ChatGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    res.json(group);
  } catch (err) { next(err); }
};

exports.createGroup = async (req, res, next) => {
  try {
    const group = await ChatGroup.create(req.body);
    res.status(201).json(group);
  } catch (err) { next(err); }
};

exports.updateGroup = async (req, res, next) => {
  try {
    const group = await ChatGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    await group.update(req.body);
    res.json(group);
  } catch (err) { next(err); }
};

exports.deleteGroup = async (req, res, next) => {
  try {
    const group = await ChatGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    await group.destroy();
    res.json({ message: 'Grupo eliminado' });
  } catch (err) { next(err); }
};
