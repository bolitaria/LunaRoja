const sequelize = require('../config/database');
const User = require('./User');
const Campaign = require('./Campaign');
const Action = require('./Action');
const ActionImage = require('./ActionImage');
const BDS = require('./BDS');
const UserCampaign = require('./UserCampaign');
const UserAction = require('./UserAction');
const UserBDS = require('./UserBDS');
const Subscriber = require('./Subscriber');
const SubscribersReminder = require('./SubscribersReminder');
const ChatGroup = require('./ChatGroup');
const News = require('./News');
const Petition = require('./Petition');
const SignatureHash = require('./SignatureHash');
const EmailQueue = require('./EmailQueue');
const EmailQuota = require('./EmailQuota');
const Report = require('./Report');
const EmailTemplate = require('./EmailTemplate');
const Link = require('./Link');
const ColectivoAfines = require('./ColectivosAfines'); 

// ============================================================
// ASOCIACIONES EXISTENTES
// ============================================================

// Campaign <-> Action
Campaign.hasMany(Action, { foreignKey: 'campaignId', as: 'campaignActions' });
Action.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

// BDS <-> Action
BDS.hasMany(Action, { foreignKey: 'bdsId', as: 'bdsActions' });
Action.belongsTo(BDS, { foreignKey: 'bdsId', as: 'bds' });

// Action <-> ActionImage
Action.hasMany(ActionImage, { foreignKey: 'actionId', as: 'images' });
ActionImage.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });

// User <-> Campaign
User.belongsToMany(Campaign, { through: UserCampaign, foreignKey: 'userId', otherKey: 'campaignId', as: 'campaigns' });
Campaign.belongsToMany(User, { through: UserCampaign, foreignKey: 'campaignId', otherKey: 'userId', as: 'users' });

// User <-> Action
User.belongsToMany(Action, { through: UserAction, foreignKey: 'userId', otherKey: 'actionId', as: 'assignedActions' });
Action.belongsToMany(User, { through: UserAction, foreignKey: 'actionId', otherKey: 'userId', as: 'assignedUsers' });

// User <-> BDS
User.belongsToMany(BDS, { through: UserBDS, foreignKey: 'userId', otherKey: 'bdsId', as: 'bdsCampaigns' });
BDS.belongsToMany(User, { through: UserBDS, foreignKey: 'bdsId', otherKey: 'userId', as: 'users' });

// Campaign <-> ChatGroup
Campaign.hasMany(ChatGroup, { foreignKey: 'campaignId', as: 'chatGroups' });
ChatGroup.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

// Action <-> ChatGroup
Action.hasMany(ChatGroup, { foreignKey: 'actionId', as: 'chatGroups' });
ChatGroup.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });

// Campaign <-> News
Campaign.hasMany(News, { foreignKey: 'campaignId', as: 'news' });
News.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

// Action <-> News
Action.hasMany(News, { foreignKey: 'actionId', as: 'news' });
News.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });

// SubscribersReminder <-> Subscriber
SubscribersReminder.belongsTo(Subscriber, { foreignKey: 'subscriberId', as: 'subscriber' });
Subscriber.hasMany(SubscribersReminder, { foreignKey: 'subscriberId', as: 'reminders' });

// SubscribersReminder <-> Action
SubscribersReminder.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });
Action.hasMany(SubscribersReminder, { foreignKey: 'actionId', as: 'reminders' });

// ============================================================
// NUEVAS ASOCIACIONES (Peticiones, Cola de Correos, Plantillas)
// ============================================================

Petition.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Petition, { foreignKey: 'created_by', as: 'petitions' });

Petition.hasMany(SignatureHash, { foreignKey: 'petition_id', as: 'signatureHashes' });
SignatureHash.belongsTo(Petition, { foreignKey: 'petition_id', as: 'petition' });

Petition.hasMany(EmailQueue, { foreignKey: 'petition_id', as: 'emailQueues' });
EmailQueue.belongsTo(Petition, { foreignKey: 'petition_id', as: 'petition' });

// Petition <-> EmailTemplate
Petition.belongsTo(EmailTemplate, { foreignKey: 'emailTemplateId', as: 'emailTemplate' });
EmailTemplate.hasMany(Petition, { foreignKey: 'emailTemplateId', as: 'petitions' });

// ============================================================
// ASOCIACIÓN PARA LINKS DE INTERÉS
// ============================================================
User.hasMany(Link, { foreignKey: 'created_by', as: 'links' });
Link.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ============================================================
// EXPORTACIÓN DE MODELOS
// ============================================================
module.exports = {
  sequelize,
  User,
  Campaign,
  Action,
  ActionImage,
  BDS,
  UserCampaign,
  UserAction,
  UserBDS,
  Subscriber,
  SubscribersReminder,
  ChatGroup,
  News,
  Petition,
  SignatureHash,
  EmailQueue,
  EmailQuota,
  Report,
  EmailTemplate,
  Link,
  ColectivoAfines, 
};