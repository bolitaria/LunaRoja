const UserCampaign = require('../models/UserCampaign');
const UserAction = require('../models/UserAction');
const Action = require('../models/Action');

const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de superadministrador.' });
  }
};

const canAccessCampaign = async (req, res, next) => {
  try {
    const user = req.user;
    const campaignId = parseInt(req.params.id);
    if (!user) return res.status(401).json({ message: 'No autenticado' });
    if (user.role === 'superadmin') return next();
    if (user.role === 'campaign_admin') {
      const userCampaigns = await UserCampaign.findAll({ where: { userId: user.id } });
      const allowedIds = userCampaigns.map(uc => uc.campaignId);
      if (allowedIds.includes(campaignId)) return next();
    }
    res.status(403).json({ message: 'No tienes permiso para acceder a esta campaña' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error de autorización' });
  }
};

const canAccessAction = async (req, res, next) => {
  try {
    const user = req.user;
    const actionId = parseInt(req.params.id);
    if (!user) return res.status(401).json({ message: 'No autenticado' });
    if (user.role === 'superadmin') return next();
    if (user.role === 'campaign_admin') {
      const action = await Action.findByPk(actionId);
      if (!action) return res.status(404).json({ message: 'Acción no encontrada' });
      const userCampaigns = await UserCampaign.findAll({ where: { userId: user.id } });
      const allowedCampaignIds = userCampaigns.map(uc => uc.campaignId);
      if (allowedCampaignIds.includes(action.campaignId)) return next();
    }
    if (user.role === 'action_admin') {
      const userActions = await UserAction.findAll({ where: { userId: user.id } });
      const allowedActionIds = userActions.map(ua => ua.actionId);
      if (allowedActionIds.includes(actionId)) return next();
    }
    res.status(403).json({ message: 'No tienes permiso para acceder a esta acción' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error de autorización' });
  }
};

module.exports = { isSuperAdmin, canAccessCampaign, canAccessAction };