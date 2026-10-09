const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Subscriber = require('../models/Subscriber');
const Donor = require('../models/Donor');
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../services/emailService');
const { enqueueWelcomeEmail } = require('../services/queueService');
const validator = require('validator');

const isValidEmail = (email) => validator.isEmail(email) && email.length <= 255;

// ─────────────────────────────────────────────────────────────
// CRUD básico (sin exponer email en listados)
// ─────────────────────────────────────────────────────────────

exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.findAll({
      attributes: ['id', 'publicId', 'subscribedAt', 'unsubscribedAt', 'status', 'sendReminders'],
      order: [['subscribedAt', 'DESC']],
    });
    res.json(subscribers);
  } catch (error) {
    console.error('getAllSubscribers error:', error);
    res.status(500).json({ message: 'Error retrieving subscribers' });
  }
};

exports.getSubscriberCount = async (req, res) => {
  try {
    const count = await Subscriber.count({ where: { status: 'active' } });
    res.json({ totalActiveSubscribers: count });
  } catch (error) {
    console.error('getSubscriberCount error:', error);
    res.status(500).json({ message: 'Error retrieving subscriber count' });
  }
};

exports.createSubscriber = async (req, res) => {
  try {
    const { email, sendReminders = false } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email format' });

    const existing = await Subscriber.findOne({ where: { email } });
    if (existing) {
      if (existing.status === 'unsubscribed') {
        await existing.update({
          status: 'active',
          sendReminders,
          subscribedAt: new Date(),
          unsubscribedAt: null,
        });
        sendWelcomeEmail(email).catch(err => console.error('Welcome email error (reactivation):', err));
        return res.json({ message: 'Subscription reactivated', subscriber: { id: existing.id, publicId: existing.publicId, status: existing.status } });
      } else {
        return res.status(400).json({ message: 'This email is already subscribed' });
      }
    }

    const subscriber = await Subscriber.create({
      email,
      sendReminders,
      status: 'active',
      subscribedAt: new Date(),
    });

    enqueueWelcomeEmail(email).catch(err => console.error('Welcome queue error:', err));
    res.status(201).json({ message: 'Subscription successful', subscriber: { id: subscriber.id, publicId: subscriber.publicId, status: subscriber.status } });
  } catch (error) {
    console.error('createSubscriber error:', error);
    res.status(500).json({ message: 'Error creating subscriber' });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) return res.status(400).json({ message: 'Valid email is required' });

    const subscriber = await Subscriber.findOne({ where: { email } });
    if (!subscriber) return res.status(404).json({ message: 'Email not found' });

    await subscriber.update({
      status: 'unsubscribed',
      unsubscribedAt: new Date(),
    });
    sendGoodbyeEmail(email).catch(err => console.error('Goodbye email error:', err));
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('unsubscribe error:', error);
    res.status(500).json({ message: 'Error unsubscribing' });
  }
};

exports.deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Subscriber.findByPk(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    await subscriber.destroy();
    res.json({ message: 'Subscriber deleted successfully' });
  } catch (error) {
    console.error('deleteSubscriber error:', error);
    res.status(500).json({ message: 'Error deleting subscriber' });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { email, sendReminders } = req.body;
    if (!email || !isValidEmail(email)) return res.status(400).json({ message: 'Valid email is required' });

    const subscriber = await Subscriber.findOne({ where: { email } });
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    await subscriber.update({ sendReminders });
    res.json({ message: 'Preferences updated', subscriber: { id: subscriber.id, sendReminders: subscriber.sendReminders } });
  } catch (error) {
    console.error('updatePreferences error:', error);
    res.status(500).json({ message: 'Error updating preferences' });
  }
};

// ─────────────────────────────────────────────────────────────
// MÉTRICAS AGREGADAS (panel admin)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/subscribers/metrics
 * Devuelve totales globales, altas/bajas del mes, y evolución por mes.
 */
exports.getMetrics = async (req, res) => {
  try {
    const [totals] = await sequelize.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'active') AS "totalActive",
        COUNT(*) FILTER (WHERE status = 'unsubscribed') AS "totalUnsubscribed",
        COUNT(*) AS "totalAll",
        COUNT(*) FILTER (
          WHERE status = 'active'
            AND "subscribedAt" >= date_trunc('month', now())
        ) AS "newThisMonth",
        COUNT(*) FILTER (
          WHERE status = 'unsubscribed'
            AND "unsubscribedAt" >= date_trunc('month', now())
        ) AS "unsubscribedThisMonth"
      FROM "Subscribers"`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Vida media (días) de suscriptores dados de baja
    const [lifetime] = await sequelize.query(
      `SELECT
        COALESCE(AVG(EXTRACT(EPOCH FROM ("unsubscribedAt" - "subscribedAt")) / 86400), 0) AS "avgLifetimeDays"
      FROM "Subscribers"
      WHERE status = 'unsubscribed'
        AND "unsubscribedAt" IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Evolución últimos 6 meses
    const byMonth = await sequelize.query(
      `SELECT
        to_char(date_trunc('month', "subscribedAt"), 'YYYY-MM') AS month,
        COUNT(*) AS "newActive"
      FROM "Subscribers"
      WHERE "subscribedAt" >= now() - interval '6 months'
      GROUP BY 1
      ORDER BY 1 ASC`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const unsubByMonth = await sequelize.query(
      `SELECT
        to_char(date_trunc('month', "unsubscribedAt"), 'YYYY-MM') AS month,
        COUNT(*) AS "newUnsub"
      FROM "Subscribers"
      WHERE "unsubscribedAt" >= now() - interval '6 months'
      GROUP BY 1
      ORDER BY 1 ASC`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Totales de donaciones
    const [donors] = await sequelize.query(
      `SELECT
        COUNT(*) AS "totalDonors",
        COUNT(DISTINCT "donorHash") AS "uniqueDonors",
        COALESCE(SUM(amount), 0) AS "totalAmount",
        COUNT(*) FILTER (WHERE "donatedAt" >= date_trunc('month', now())) AS "donorsThisMonth",
        COALESCE(SUM(amount) FILTER (WHERE "donatedAt" >= date_trunc('month', now())), 0) AS "amountThisMonth"
      FROM "Donors"
      WHERE status = 'completed'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    res.json({
      subscribers: {
        ...totals,
        avgLifetimeDays: Math.round(Number(lifetime.avgLifetimeDays || 0)),
        byMonth,
        unsubByMonth,
      },
      donors,
    });
  } catch (error) {
    console.error('getMetrics error:', error);
    res.status(500).json({ message: 'Error retrieving metrics' });
  }
};

/**
 * GET /api/subscribers/by-campaign
 * Suscriptores agrupados por campaña (o BDS si entityType='bds').
 */
exports.getByCampaign = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT
        sc."entityType" AS "entityType",
        sc."entityId" AS "entityId",
        COUNT(*) FILTER (WHERE sc."isFollowing" = true) AS "subscribers",
        MAX(sc."createdAt") AS "lastSubscribedAt",
        MIN(sc."createdAt") AS "firstSubscribedAt"
      FROM "SubscriberCampaigns" sc
      GROUP BY sc."entityType", sc."entityId"
      ORDER BY "subscribers" DESC`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Enriquecer con nombre de campaña / BDS
    const enriched = await Promise.all(rows.map(async (r) => {
      let name = 'Desconocido';
      if (r.entityType === 'campaign') {
        const [row] = await sequelize.query(
          `SELECT name FROM "Campaigns" WHERE id = :id LIMIT 1`,
          { replacements: { id: r.entityId }, type: Sequelize.QueryTypes.SELECT }
        );
        if (row) name = row.name;
      } else if (r.entityType === 'bds') {
        const [row] = await sequelize.query(
          `SELECT name FROM "BDSs" WHERE id = :id LIMIT 1`,
          { replacements: { id: r.entityId }, type: Sequelize.QueryTypes.SELECT }
        );
        if (row) name = row.name;
      }
      return { ...r, name };
    }));

    res.json(enriched);
  } catch (error) {
    console.error('getByCampaign error:', error);
    res.status(500).json({ message: 'Error retrieving by-campaign' });
  }
};

/**
 * GET /api/subscribers/by-action
 * Suscriptores (followers) por acción, con fecha del evento para recordatorios.
 */
exports.getByAction = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT
        sa."actionId" AS "actionId",
        COUNT(*) FILTER (WHERE sa."isFollowing" = true) AS "followers",
        MAX(sa."createdAt") AS "lastSubscribedAt",
        a.title AS "actionTitle",
        a.datetime AS "eventDate",
        a."locationType" AS "locationType"
      FROM "SubscriberActions" sa
      LEFT JOIN "Actions" a ON a.id = sa."actionId"
      GROUP BY sa."actionId", a.title, a.datetime, a."locationType"
      ORDER BY a.datetime ASC NULLS LAST`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    res.json(rows);
  } catch (error) {
    console.error('getByAction error:', error);
    res.status(500).json({ message: 'Error retrieving by-action' });
  }
};

/**
 * GET /api/subscribers/activity?limit=20
 * Últimas actividades: altas, bajas y donaciones (sin emails).
 */
exports.getActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const subs = await sequelize.query(
      `SELECT
        'subscribe' AS type,
        "publicId",
        "subscribedAt" AS at
      FROM "Subscribers"
      WHERE "subscribedAt" IS NOT NULL
      ORDER BY "subscribedAt" DESC
      LIMIT :limit`,
      { replacements: { limit }, type: Sequelize.QueryTypes.SELECT }
    );

    const unsubs = await sequelize.query(
      `SELECT
        'unsubscribe' AS type,
        "publicId",
        "unsubscribedAt" AS at
      FROM "Subscribers"
      WHERE "unsubscribedAt" IS NOT NULL
      ORDER BY "unsubscribedAt" DESC
      LIMIT :limit`,
      { replacements: { limit }, type: Sequelize.QueryTypes.SELECT }
    );

    const donates = await sequelize.query(
      `SELECT
        'donation' AS type,
        "publicId",
        amount,
        currency,
        "donatedAt" AS at
      FROM "Donors"
      WHERE status = 'completed'
      ORDER BY "donatedAt" DESC
      LIMIT :limit`,
      { replacements: { limit }, type: Sequelize.QueryTypes.SELECT }
    );

    const all = [...subs, ...unsubs, ...donates]
      .filter(a => a.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, limit);

    res.json(all);
  } catch (error) {
    console.error('getActivity error:', error);
    res.status(500).json({ message: 'Error retrieving activity' });
  }
};
