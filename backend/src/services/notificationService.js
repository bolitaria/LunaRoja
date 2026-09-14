const Subscriber = require('../models/Subscriber');
const SubscriberCampaign = require('../models/SubscriberCampaign');
const SubscriberAction = require('../models/SubscriberAction');
const {
  sendCampaignNotification,
  sendActionNotification,
  sendPetitionNotification,
  sendReportNotification,
} = require('./emailService');

const getUnfollowCampaignLink = (subscriberId, type, id) =>
  `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/subscribers/unfollow-campaign?subscriberId=${subscriberId}&type=${type}&id=${id}`;

const getUnfollowActionLink = (subscriberId, actionId) =>
  `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/subscribers/unfollow-action?subscriberId=${subscriberId}&actionId=${actionId}`;

async function notifyNewCampaign(entity, type = 'campaign') {
  const subscribers = await Subscriber.findAll({ where: { status: 'active' } });
  for (const sub of subscribers) {
    const data = { subscriberId: sub.id, isFollowing: true };
    if (type === 'bds') data.bdsId = entity.id;
    else data.campaignId = entity.id;
    await SubscriberCampaign.create(data);
    await sendCampaignNotification(sub.email, {
      ...entity.toJSON(),
      type,
      unfollowLink: getUnfollowCampaignLink(sub.id, type, entity.id),
    }).catch(err => console.error(`Error email campaña a ${sub.email}:`, err));
  }
}

async function notifyNewAction(action, campaign = null, campaignType = null) {
  let subscribers;
  if (campaign) {
    const where = { isFollowing: true };
    if (campaignType === 'bds') where.bdsId = campaign.id;
    else where.campaignId = campaign.id;
    const relations = await SubscriberCampaign.findAll({ where });
    const subscriberIds = relations.map(r => r.subscriberId);
    if (subscriberIds.length === 0) return;
    subscribers = await Subscriber.findAll({ where: { id: subscriberIds, status: 'active' } });
  } else {
    subscribers = await Subscriber.findAll({ where: { status: 'active' } });
  }

  for (const sub of subscribers) {
    await SubscriberAction.create({ subscriberId: sub.id, actionId: action.id, isFollowing: true });
    await sendActionNotification(sub.email, action, campaign, {
      unfollowLink: getUnfollowActionLink(sub.id, action.id),
    }).catch(err => console.error(`Error email acción a ${sub.email}:`, err));
  }
}

async function notifyNewPetition(petition) {
  const subscribers = await Subscriber.findAll({ where: { status: 'active' } });
  for (const sub of subscribers) {
    await sendPetitionNotification(sub.email, petition).catch(err => console.error(`Error email petición a ${sub.email}:`, err));
  }
}

async function notifyNewReport(report) {
  const subscribers = await Subscriber.findAll({ where: { status: 'active' } });
  for (const sub of subscribers) {
    await sendReportNotification(sub.email, report).catch(err => console.error(`Error email reporte a ${sub.email}:`, err));
  }
}

module.exports = { notifyNewCampaign, notifyNewAction, notifyNewPetition, notifyNewReport };