// backend/src/controllers/petitionController.js
const { Petition, SignatureHash, EmailTemplate, User } = require('../models');
const { buildSignatureSchema } = require('../utils/dynamicValidation');
const { sendPetitionAlert, sendEmailWithTemplate } = require('../services/emailService');
const { getQueue } = require('../services/queueService');
const quotaService = require('../services/quotaService');
const { msUntilNextMadridMidnight } = require('../utils/time');
const { getGlobalPetitionMetrics } = require('../services/petitionMetricsService');
const { logAdminAction } = require('../services/auditService');
const cacheMiddleware = require('../middlewares/cache');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const createError = require('http-errors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const HASH_SECRET = process.env.SIGNATURE_HASH_SECRET || 'supersecret_change_me';

function parseEmails(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    return input.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function parseSignatureFields(input) {
  if (!input) return [];
  if (typeof input === 'string') {
    try { return JSON.parse(input); } catch { return []; }
  }
  return input;
}

function getField(body, camelKey, snakeKey) {
  return body[camelKey] !== undefined ? body[camelKey] : body[snakeKey];
}

async function saveBase64Image(base64String) {
  if (!base64String) return null;
  const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches) return null;
  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const data = Buffer.from(matches[2], 'base64');
  const filename = `petition-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const uploadPath = '/app/uploads/petitions';
  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
  const filePath = path.join(uploadPath, filename);
  await fs.promises.writeFile(filePath, data);
  return `/uploads/petitions/${filename}`;
}

async function getDefaultPetitionTemplate() {
  return await EmailTemplate.findOne({
    where: { associatedEvent: 'petition', type: 'system', isActive: true },
  });
}

exports.createPetition = async (req, res, next) => {
  try {
    const title = req.body.title;
    const content = req.body.content;
    const type = req.body.type;
    const externalUrl = getField(req.body, 'externalUrl', 'external_url');
    const urgency = req.body.urgency;
    const deadline = req.body.deadline;
    const hidden = req.body.hidden;
    let emailTemplateId = getField(req.body, 'emailTemplateId', 'email_template_id');
    const emailSubject = getField(req.body, 'emailSubject', 'email_subject');
    const signatureFields = parseSignatureFields(getField(req.body, 'signatureFields', 'signature_fields'));
    const targetEmailsRaw = getField(req.body, 'targetEmails', 'target_emails') || getField(req.body, 'recipientEmails', 'recipient_emails');

    const headerColor = req.body.headerColor || null;
    const buttonColor = req.body.buttonColor || null;
    const footerColor = req.body.footerColor || null;
    const backgroundColor = req.body.backgroundColor || null;
    const titleColor = req.body.titleColor || '#ffffff';
    const footerTitleColor = req.body.footerTitleColor || '#ffffff';

    let featuredImage = req.file ? `/uploads/petitions/${req.file.filename}` : null;
    if (!featuredImage && req.body.imageBase64) {
      try {
        featuredImage = await saveBase64Image(req.body.imageBase64);
      } catch (err) { console.error('Error guardando imagen base64:', err); }
    }

    if (!title) throw createError(400, 'El título es obligatorio');

    let petition;

    if (type === 'official' || type === 'external') {
      if (!externalUrl || externalUrl.trim() === '') {
        throw createError(400, 'La URL externa es obligatoria para peticiones externas');
      }
      if (!emailTemplateId) {
        const defaultTemplate = await getDefaultPetitionTemplate();
        if (defaultTemplate) emailTemplateId = defaultTemplate.id;
      }
      petition = await Petition.create({
        title,
        content: `Serás redirigido al sitio oficial: ${externalUrl}`,
        target_emails: [],
        signature_fields: [],
        type: 'official',
        external_url: externalUrl,
        urgency: urgency || false,
        deadline: (deadline && deadline !== '' && deadline !== 'Invalid date') ? deadline : null,
        hidden: hidden || false,
        emailTemplateId: emailTemplateId || null,
        featured_image: featuredImage,
        email_subject: emailSubject || null,
        header_color: headerColor,
        title_color: titleColor,
        footer_title_color: footerTitleColor,
        button_color: buttonColor,
        footer_color: footerColor,
        background_color: backgroundColor,
        created_by: req.user.id,
      });
    } else {
      if (!content) throw createError(400, 'El contenido es obligatorio');
      const emails = parseEmails(targetEmailsRaw);
      if (emails.length === 0) throw createError(400, 'Debe incluir al menos un email destinatario');

      if (!emailTemplateId) {
        const defaultTemplate = await getDefaultPetitionTemplate();
        if (defaultTemplate) emailTemplateId = defaultTemplate.id;
      }

      petition = await Petition.create({
        title,
        content,
        target_emails: emails,
        signature_fields: signatureFields,
        type: 'custom',
        urgency: urgency || false,
        deadline: (deadline && deadline !== '' && deadline !== 'Invalid date') ? deadline : null,
        hidden: hidden || false,
        emailTemplateId: emailTemplateId || null,
        featured_image: featuredImage,
        email_subject: emailSubject || null,
        header_color: headerColor,
        title_color: titleColor,
        footer_title_color: footerTitleColor,
        button_color: buttonColor,
        footer_color: footerColor,
        background_color: backgroundColor,
        created_by: req.user.id,
      });
    }

    await cacheMiddleware.invalidateResource('petitions', petition.id);
    await logAdminAction(req, {
      action: 'create',
      entityType: 'petition',
      entityId: petition.id,
      metadata: { title: petition.title, type: petition.type },
    });

    res.status(201).json({ id: petition.id });
  } catch (err) { next(err); }
};

exports.getPetition = async (req, res, next) => {
  try {
    const petition = await Petition.findByPk(req.params.id, {
      attributes: ['id', 'title', 'content', 'total_signatures', 'signature_fields', 'type', 'external_url', 'urgency', 'deadline', 'hidden', 'featured_image', 'created_at', 'header_color', 'title_color', 'footer_color', 'footer_title_color', 'target_emails', 'emailTemplateId'],
    });
    if (!petition) throw createError(404, 'Petición no encontrada');
    res.json(petition);
  } catch (err) { next(err); }
};

exports.signPetition = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const petition = await Petition.findByPk(req.params.id, { transaction });
    if (!petition) throw createError(404, 'Petición no encontrada');
    const schema = buildSignatureSchema(petition.signature_fields);
    const { error, value } = schema.validate(req.body);
    if (error) throw createError(400, error.details[0].message);
    const uniqueFields = petition.signature_fields.filter(f => f.unique === true || f.name === 'email');
    if (uniqueFields.length === 0) uniqueFields.push({ name: 'email' });
    const identifierString = uniqueFields.map(f => (value[f.name] || '').toString().toLowerCase().trim()).join('|');
    const identifierHash = crypto.createHmac('sha256', HASH_SECRET).update(identifierString).digest('hex');
    const existing = await SignatureHash.findOne({
      where: { petition_id: petition.id, identifier_hash: identifierHash },
      transaction,
    });
    if (existing) throw createError(409, 'Ya has firmado esta petición');
    await SignatureHash.create({ petition_id: petition.id, identifier_hash: identifierHash }, { transaction });
    petition.total_signatures += 1;
    await petition.save({ transaction });
    await transaction.commit();

    // Datos del firmante (solo en memoria / Redis temporal, NUNCA en Postgres)
    const emailData = {};
    petition.signature_fields.forEach(f => { emailData[f.label || f.name] = value[f.name] || ''; });

    const colors = {
      headerColor: petition.header_color,
      buttonColor: petition.button_color,
      footerColor: petition.footer_color,
      backgroundColor: petition.background_color,
    };

    // ¿Hay cuota ahora mismo?
    const canSendNow = await quotaService.hasCapacity();

    if (canSendNow) {
      // Envío síncrono: los datos del firmante viven SOLO en memoria
      try {
        let sent = false;

        if (petition.emailTemplateId) {
          const template = await EmailTemplate.findByPk(petition.emailTemplateId);
          if (template) {
            const mergedColors = {
              headerColor: colors.headerColor || template.headerColor,
              buttonColor: colors.buttonColor || template.buttonColor,
              footerColor: colors.footerColor || template.footerColor,
              backgroundColor: colors.backgroundColor || template.backgroundColor,
            };
            sent = await sendEmailWithTemplate(
              petition.target_emails,
              template,
              { ...emailData, petition },
              mergedColors
            );
          }
        }

        if (!sent) {
          const result = await sendPetitionAlert(petition, emailData);
          sent = result && result.success === true;
        }

        if (sent) {
          await quotaService.increment();
        } else {
          console.warn(`[signPetition] Envío fallido para petition ${petition.id}`);
        }
      } catch (err) {
        console.error('[signPetition] Error enviando email síncrono:', err.message);
        // Por privacidad: no reintentamos ni persistimos datos del firmante
      }
    } else {
      // Cuota agotada → encolar para próxima medianoche Madrid.
      // Los datos del firmante viven temporalmente en Redis (purgados al enviar o en 24h).
      try {
        await getQueue('petition-signature-email').add(
          'send-signature-email',
          {
            petitionId: petition.id,
            targetEmails: petition.target_emails,
            templateId: petition.emailTemplateId || null,
            colors,
            emailData,
          },
          {
            delay: msUntilNextMadridMidnight(),
            removeOnComplete: true,
            removeOnFail: { age: 86400 },
            attempts: 3,
            backoff: { type: 'exponential', delay: 10000 },
          }
        );
        console.log(`[signPetition] Cuota agotada. Email encolado para próxima medianoche Madrid.`);
      } catch (err) {
        console.error('[signPetition] Error encolando email:', err.message);
      }
    }

    res.status(201).json({ message: 'Firma registrada con éxito', total: petition.total_signatures });
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    next(err);
  }
};

exports.updatePetition = async (req, res, next) => {
  try {
    const petition = await Petition.findByPk(req.params.id);
    if (!petition) throw createError(404, 'Petición no encontrada');
    if (petition.total_signatures > 0) return res.status(403).json({ message: 'No se puede editar una petición que ya tiene firmas' });

    const title = req.body.title;
    const content = req.body.content;
    const type = req.body.type;
    const externalUrl = getField(req.body, 'externalUrl', 'external_url');
    const urgency = req.body.urgency;
    const deadline = req.body.deadline;
    const hidden = req.body.hidden;
    const emailTemplateId = getField(req.body, 'emailTemplateId', 'email_template_id');
    const signatureFields = parseSignatureFields(getField(req.body, 'signatureFields', 'signature_fields'));
    const targetEmailsRaw = getField(req.body, 'targetEmails', 'target_emails') || getField(req.body, 'recipientEmails', 'recipient_emails');
    const headerColor = req.body.headerColor !== undefined ? req.body.headerColor : petition.header_color;
    const buttonColor = req.body.buttonColor !== undefined ? req.body.buttonColor : petition.button_color;
    const footerColor = req.body.footerColor !== undefined ? req.body.footerColor : petition.footer_color;
    const backgroundColor = req.body.backgroundColor !== undefined ? req.body.backgroundColor : petition.background_color;
    const titleColor = req.body.titleColor !== undefined ? req.body.titleColor : petition.title_color;
    const footerTitleColor = req.body.footerTitleColor !== undefined ? req.body.footerTitleColor : petition.footer_title_color;

    let featuredImage = req.file ? `/uploads/petitions/${req.file.filename}` : petition.featured_image;
    if (!req.file && req.body.imageBase64) {
      try {
        featuredImage = await saveBase64Image(req.body.imageBase64) || petition.featured_image;
      } catch (err) { console.error('Error guardando imagen base64:', err); }
    }

    const isExternal = type === 'official' || type === 'external';

    await petition.update({
      title: title || petition.title,
      content: content || petition.content,
      target_emails: isExternal ? [] : (targetEmailsRaw ? parseEmails(targetEmailsRaw) : petition.target_emails),
      signature_fields: isExternal ? [] : (signatureFields || petition.signature_fields),
      type: isExternal ? 'official' : 'custom',
      external_url: externalUrl !== undefined ? externalUrl : petition.external_url,
      urgency: urgency !== undefined ? urgency : petition.urgency,
      deadline: (deadline && deadline !== '' && deadline !== 'Invalid date') ? deadline : petition.deadline,
      hidden: hidden !== undefined ? hidden : petition.hidden,
      emailTemplateId: emailTemplateId !== undefined ? emailTemplateId : petition.emailTemplateId,
      featured_image: featuredImage,
      header_color: headerColor,
      title_color: titleColor,
      footer_title_color: footerTitleColor,
      button_color: buttonColor,
      footer_color: footerColor,
      background_color: backgroundColor,
    });

    await cacheMiddleware.invalidateResource('petitions', petition.id);
    await logAdminAction(req, {
      action: 'update',
      entityType: 'petition',
      entityId: petition.id,
      metadata: { changed: Object.keys(req.body) },
    });

    res.json({ id: petition.id });
  } catch (err) { next(err); }
};

exports.deletePetition = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const petition = await Petition.findByPk(req.params.id, { transaction });
    if (!petition) { await transaction.rollback(); return res.status(404).json({ message: 'Petición no encontrada' }); }

    const snapshot = { title: petition.title, type: petition.type };

    await SignatureHash.destroy({ where: { petition_id: petition.id }, transaction });
    await petition.destroy({ transaction });
    await transaction.commit();

    await cacheMiddleware.invalidateResource('petitions', petition.id);
    await logAdminAction(req, {
      action: 'delete',
      entityType: 'petition',
      entityId: petition.id,
      metadata: snapshot,
    });

    res.status(200).json({ message: 'Petición eliminada' });
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    next(err);
  }
};

exports.listPetitions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      type,
      urgency,
      hidden,
      minSignatures,
      createdFrom,
      createdTo,
      deadlineFrom,
      deadlineTo,
    } = req.query;

    const conditions = [];
    const replacements = {};

    if (search) {
      conditions.push(`p.title ILIKE :search`);
      replacements.search = `%${search}%`;
    }
    if (type && ['official', 'custom'].includes(type)) {
      conditions.push(`p.type = :type`);
      replacements.type = type;
    }
    if (urgency === 'true') {
      conditions.push(`p.urgency = true`);
    } else if (urgency === 'false') {
      conditions.push(`p.urgency = false`);
    }
    if (hidden === 'true') {
      conditions.push(`p.hidden = true`);
    } else if (hidden === 'false') {
      conditions.push(`p.hidden = false`);
    }
    if (minSignatures) {
      conditions.push(`p.total_signatures >= :minSignatures`);
      replacements.minSignatures = parseInt(minSignatures, 10);
    }
    if (createdFrom) {
      conditions.push(`p.created_at >= :createdFrom`);
      replacements.createdFrom = new Date(createdFrom);
    }
    if (createdTo) {
      conditions.push(`p.created_at <= :createdTo`);
      replacements.createdTo = new Date(createdTo + 'T23:59:59');
    }
    if (deadlineFrom) {
      conditions.push(`p.deadline >= :deadlineFrom`);
      replacements.deadlineFrom = new Date(deadlineFrom);
    }
    if (deadlineTo) {
      conditions.push(`p.deadline <= :deadlineTo`);
      replacements.deadlineTo = new Date(deadlineTo + 'T23:59:59');
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = Math.min(parseInt(limit) || 12, 1000);
    const offset = (parsedPage - 1) * parsedLimit;

    const sql = `
      SELECT
        p.*,
        (SELECT COUNT(*)::int FROM signature_hashes sh WHERE sh.petition_id = p.id) AS "signatureCount"
      FROM petitions p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT :limit OFFSET :offset
    `;
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM petitions p
      ${whereClause}
    `;

    const [rows, countResult] = await Promise.all([
      sequelize.query(sql, {
        replacements: { ...replacements, limit: parsedLimit, offset },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(countSql, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }),
    ]);

    const total = countResult[0]?.total || 0;
    const data = rows.map(row => ({
      ...row,
      signatureCount: row.signatureCount || 0,
    }));

    const metrics = await getGlobalPetitionMetrics();

    res.json({
      data,
      total,
      page: parsedPage,
      limit: parsedLimit,
      metrics,
    });
  } catch (err) {
    next(err);
  }
};

exports.listPublicPetitions = async (req, res, next) => {
  try {
    const petitions = await Petition.findAll({
      where: { hidden: false },
      attributes: ['id', 'title', 'type', 'urgency', 'deadline', 'total_signatures', 'featured_image', 'external_url', 'created_at'],
      order: [['created_at', 'DESC']],
    });
    res.json(petitions);
  } catch (err) { next(err); }
};

/**
 * GET /api/petitions/quota/today
 * Devuelve las estadísticas de la cuota diaria de emails.
 * Solo accesible para admins con permiso de gestionar peticiones.
 */
exports.getQuotaStats = async (req, res, next) => {
  try {
    const stats = await quotaService.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

