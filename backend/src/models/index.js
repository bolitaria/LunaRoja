const sequelize = require('../config/database');
const User = require('./User');
const Campaign = require('./Campaign');
const Action = require('./Action');
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
const SubscriberCampaign = require('./SubscriberCampaign');
const SubscriberAction = require('./SubscriberAction');
const AdminAuditLog = require('./AdminAuditLog');
const Document = require('./Document');

// ============================================================
// ASOCIACIONES EXISTENTES
// ============================================================

Campaign.hasMany(Action, { foreignKey: 'campaignId', as: 'campaignActions' });
Action.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

BDS.hasMany(Action, { foreignKey: 'bdsId', as: 'bdsActions' });
Action.belongsTo(BDS, { foreignKey: 'bdsId', as: 'bds' });

User.belongsToMany(Campaign, { through: UserCampaign, foreignKey: 'userId', otherKey: 'campaignId', as: 'campaigns' });
Campaign.belongsToMany(User, { through: UserCampaign, foreignKey: 'campaignId', otherKey: 'userId', as: 'users' });

User.belongsToMany(Action, { through: UserAction, foreignKey: 'userId', otherKey: 'actionId', as: 'assignedActions' });
Action.belongsToMany(User, { through: UserAction, foreignKey: 'actionId', otherKey: 'userId', as: 'assignedUsers' });

User.belongsToMany(BDS, { through: UserBDS, foreignKey: 'userId', otherKey: 'bdsId', as: 'bdsCampaigns' });
BDS.belongsToMany(User, { through: UserBDS, foreignKey: 'bdsId', otherKey: 'userId', as: 'users' });

Campaign.hasMany(ChatGroup, { foreignKey: 'campaignId', as: 'chatGroups' });
ChatGroup.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

Action.hasMany(ChatGroup, { foreignKey: 'actionId', as: 'chatGroups' });
ChatGroup.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });

Campaign.hasMany(News, { foreignKey: 'campaignId', as: 'news' });
News.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

Action.hasMany(News, { foreignKey: 'actionId', as: 'news' });
News.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });

SubscribersReminder.belongsTo(Subscriber, { foreignKey: 'subscriberId', as: 'subscriber' });
Subscriber.hasMany(SubscribersReminder, { foreignKey: 'subscriberId', as: 'reminders' });

SubscribersReminder.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });
Action.hasMany(SubscribersReminder, { foreignKey: 'actionId', as: 'reminders' });

// ============================================================
// PETICIONES, COLA DE CORREOS, PLANTILLAS
// ============================================================
Petition.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Petition, { foreignKey: 'created_by', as: 'petitions' });

Petition.hasMany(SignatureHash, { foreignKey: 'petition_id', as: 'signatureHashes' });
SignatureHash.belongsTo(Petition, { foreignKey: 'petition_id', as: 'petition' });

Petition.hasMany(EmailQueue, { foreignKey: 'petition_id', as: 'emailQueues' });
EmailQueue.belongsTo(Petition, { foreignKey: 'petition_id', as: 'petition' });

Petition.belongsTo(EmailTemplate, { foreignKey: 'emailTemplateId', as: 'emailTemplate' });
EmailTemplate.hasMany(Petition, { foreignKey: 'emailTemplateId', as: 'petitions' });

// ============================================================
// LINKS DE INTERÉS
// ============================================================
User.hasMany(Link, { foreignKey: 'created_by', as: 'links' });
Link.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ============================================================
// NUEVAS ASOCIACIONES: Seguimiento de campañas y acciones
// ============================================================

Subscriber.hasMany(SubscriberCampaign, { foreignKey: 'subscriberId', as: 'subscriberCampaigns' });
SubscriberCampaign.belongsTo(Subscriber, { foreignKey: 'subscriberId', as: 'subscriber' });

Campaign.hasMany(SubscriberCampaign, { foreignKey: 'campaignId', as: 'subscriberCampaigns' });
SubscriberCampaign.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

BDS.hasMany(SubscriberCampaign, { foreignKey: 'bdsId', as: 'subscriberCampaigns' });
SubscriberCampaign.belongsTo(BDS, { foreignKey: 'bdsId', as: 'bds' });

Subscriber.hasMany(SubscriberAction, { foreignKey: 'subscriberId', as: 'subscriberActions' });
SubscriberAction.belongsTo(Subscriber, { foreignKey: 'subscriberId', as: 'subscriber' });

Action.hasMany(SubscriberAction, { foreignKey: 'actionId', as: 'subscriberActions' });
SubscriberAction.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });

// ============================================================
// AUDITORÍA
// ============================================================
AdminAuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AdminAuditLog, { foreignKey: 'userId', as: 'auditLogs' });

// ============================================================
// DOCUMENTOS (sistema polimórfico nuevo)
// ============================================================
// Un Document pertenece a UNA de las 4 entidades (action/campaign/bds/report)
// y a un User (uploadedBy, opcional).
//
// Las asociaciones inversas (hasMany) son necesarias para poder hacer
// `Action.findOne({ include: [{ model: Document, as: 'documents' }] })`.

Document.belongsTo(Action,   { foreignKey: 'actionId',   as: 'action' });
Document.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
Document.belongsTo(BDS,      { foreignKey: 'bdsId',      as: 'bds' });
Document.belongsTo(Report,   { foreignKey: 'reportId',   as: 'report' });
Document.belongsTo(User,     { foreignKey: 'uploadedBy', as: 'uploader' });

Action.hasMany(Document,   { foreignKey: 'actionId',   as: 'documents' });
Campaign.hasMany(Document, { foreignKey: 'campaignId', as: 'documents' });
BDS.hasMany(Document,      { foreignKey: 'bdsId',      as: 'documents' });
Report.hasMany(Document,   { foreignKey: 'reportId',   as: 'documents' });
User.hasMany(Document,     { foreignKey: 'uploadedBy', as: 'uploadedDocuments' });

// ============================================================
// EXPORTACIÓN DE MODELOS
// ============================================================
module.exports = {
  sequelize,
  User,
  Campaign,
  Action,
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
  SubscriberCampaign,
  SubscriberAction,
  AdminAuditLog,
  Document,
};
