const Sequelize = require('sequelize');
const sequelize = require('../config/database');

// Importar modelos
const User = require('./User');
const Campaign = require('./Campaign');
const Action = require('./Action');
const ActionImage = require('./ActionImage');
const Noticia = require('./News');
const Report = require('./Report');
const Subscriber = require('./Subscriber');
const ChatGroup = require('./ChatGroup');
const UserCampaign = require('./UserCampaign');
const UserAction = require('./UserAction');
const Document = require('./Document');
const SubscribersReminder = require('./SubscribersReminder');
const BDS = require('./BDS');
const UserBDS = require('./UserBDS');

// ============================
// ASOCIACIONES
// ============================

// Campaign - Action
Campaign.hasMany(Action, { foreignKey: 'campaignId', as: 'actions', onDelete: 'SET NULL' });
Action.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign', onDelete: 'SET NULL' });

// Action - ActionImage
Action.hasMany(ActionImage, { foreignKey: 'actionId', as: 'images', onDelete: 'CASCADE' });
ActionImage.belongsTo(Action, { foreignKey: 'actionId', as: 'action', onDelete: 'CASCADE' });

// Action - ChatGroup
Action.hasMany(ChatGroup, { foreignKey: 'actionId', as: 'chatGroups', onDelete: 'CASCADE' });
ChatGroup.belongsTo(Action, { foreignKey: 'actionId', as: 'assignedAction', onDelete: 'CASCADE' });

// User - Campaign (many-to-many)
User.belongsToMany(Campaign, { through: UserCampaign, as: 'campaigns', foreignKey: 'userId', onDelete: 'CASCADE' });
Campaign.belongsToMany(User, { through: UserCampaign, as: 'admins', foreignKey: 'campaignId', onDelete: 'CASCADE' });

// User - Action (many-to-many)
User.belongsToMany(Action, { through: UserAction, as: 'actions', foreignKey: 'userId', onDelete: 'CASCADE' });
Action.belongsToMany(User, { through: UserAction, as: 'admins', foreignKey: 'actionId', onDelete: 'CASCADE' });

// BDS - Action
BDS.hasMany(Action, { foreignKey: 'bdsId', as: 'actions', onDelete: 'SET NULL' });
Action.belongsTo(BDS, { foreignKey: 'bdsId', as: 'bds', onDelete: 'SET NULL' });

// ❌ Comentada: BDS - ChatGroup (no existe la columna bdsId en ChatGroups)
// BDS.hasMany(ChatGroup, { foreignKey: 'bdsId', as: 'chatGroups', onDelete: 'SET NULL' });
// ChatGroup.belongsTo(BDS, { foreignKey: 'bdsId', as: 'assignedBDS', onDelete: 'SET NULL' });

// BDS - User (many-to-many)
User.belongsToMany(BDS, { through: UserBDS, as: 'bdsCampaigns', foreignKey: 'userId', onDelete: 'CASCADE' });
BDS.belongsToMany(User, { through: UserBDS, as: 'admins', foreignKey: 'bdsId', onDelete: 'CASCADE' });

// ChatGroup - Campaign
ChatGroup.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign', onDelete: 'SET NULL' });
Campaign.hasMany(ChatGroup, { foreignKey: 'campaignId', as: 'campaignGroups', onDelete: 'SET NULL' });

// Noticia - Campaign & Action
Noticia.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign', onDelete: 'SET NULL' });
Noticia.belongsTo(Action, { foreignKey: 'actionId', as: 'action', onDelete: 'SET NULL' });
Campaign.hasMany(Noticia, { foreignKey: 'campaignId', as: 'noticias', onDelete: 'SET NULL' });
Action.hasMany(Noticia, { foreignKey: 'actionId', as: 'noticias', onDelete: 'SET NULL' });

// Document - Campaign & Action
Document.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign', onDelete: 'SET NULL' });
Document.belongsTo(Action, { foreignKey: 'actionId', as: 'action', onDelete: 'SET NULL' });
Campaign.hasMany(Document, { foreignKey: 'campaignId', as: 'documents', onDelete: 'SET NULL' });
Action.hasMany(Document, { foreignKey: 'actionId', as: 'documents', onDelete: 'SET NULL' });

// Action - SubscribersReminder
Action.hasMany(SubscribersReminder, { foreignKey: 'actionId', as: 'reminders', onDelete: 'CASCADE' });
SubscribersReminder.belongsTo(Action, { foreignKey: 'actionId', as: 'action', onDelete: 'CASCADE' });

// Subscriber - SubscribersReminder
Subscriber.hasMany(SubscribersReminder, { foreignKey: 'subscriberId', as: 'reminders', onDelete: 'CASCADE' });
SubscribersReminder.belongsTo(Subscriber, { foreignKey: 'subscriberId', as: 'subscriber', onDelete: 'CASCADE' });

// Exportar modelos y sequelize
const db = {
  sequelize,
  Sequelize,
  User,
  Campaign,
  Action,
  ActionImage,
  Noticia,
  Report,
  Subscriber,
  ChatGroup,
  UserCampaign,
  UserAction,
  Document,
  SubscribersReminder,
  BDS,
  UserBDS,
};

module.exports = db;