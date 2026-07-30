// backend/src/controllers/petitionController.js (versión corregida)
const { Petition, SignatureHash } = require('../models');
const { buildSignatureSchema } = require('../utils/dynamicValidation');
const { sendPetitionAlert, sendEmailWithTemplate } = require('../services/emailService');
const sequelize = require('../config/database');
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

exports.createPetition = async (req, res, next) => {
  try {
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

    let featuredImage = req.file ? `/uploads/petitions/${req.file.filename}` : null;
    if (!featuredImage && req.body.imageBase64) {
      try {
        featuredImage = await saveBase64Image(req.body.imageBase64);
      } catch (err) { console.error('Error guardando imagen base64:', err); }
    }

    if (!title) throw createError(400, 'El título es obligatorio');

    // Peticiones externas
    if (type === 'official' || type === 'external') {
      if (!externalUrl || externalUrl.trim() === '') {
        throw createError(400, 'La URL externa es obligatoria para peticiones externas');
      }
      const petition = await Petition.create({
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
        created_by: req.user.id,
      });
      return res.status(201).json({ id: petition.id });
    }

    // Peticiones internas
    if (!content) throw createError(400, 'El contenido es obligatorio');
    const emails = parseEmails(targetEmailsRaw);
    if (emails.length === 0) throw createError(400, 'Debe incluir al menos un email destinatario');

    const petition = await Petition.create({
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
      created_by: req.user.id,
    });
    res.status(201).json({ id: petition.id });
  } catch (err) { next(err); }
};

exports.getPetition = async (req, res, next) => {
  try {
    const petition = await Petition.findByPk(req.params.id, {
      attributes: ['id', 'title', 'content', 'total_signatures', 'signature_fields', 'type', 'external_url', 'urgency', 'deadline', 'hidden', 'featured_image', 'created_at'],
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

    const emailData = {};
    petition.signature_fields.forEach(f => { emailData[f.label || f.name] = value[f.name] || ''; });

    // Usar plantilla y sus colores (los colores están en EmailTemplates, no en petitions)
    if (petition.emailTemplateId) {
      try {
        const EmailTemplate = require('../models/EmailTemplate');
        const template = await EmailTemplate.findByPk(petition.emailTemplateId);
        if (template) {
          const colors = {
            headerColor: template.headerColor,
            buttonColor: template.buttonColor,
            footerColor: template.footerColor,
            backgroundColor: template.backgroundColor,
          };
          await sendEmailWithTemplate(petition.target_emails, template, { ...emailData, petition });
          return res.status(201).json({ message: 'Firma registrada con éxito', total: petition.total_signatures });
        }
      } catch (err) { console.error('Error enviando email con plantilla:', err); }
    }

    // Fallback: envío estático
    sendPetitionAlert(petition, emailData).catch(err => console.error('Error enviando correo:', err));
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
    });
    res.json({ id: petition.id });
  } catch (err) { next(err); }
};

exports.deletePetition = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const petition = await Petition.findByPk(req.params.id, { transaction });
    if (!petition) { await transaction.rollback(); return res.status(404).json({ message: 'Petición no encontrada' }); }
    await SignatureHash.destroy({ where: { petition_id: petition.id }, transaction });
    await petition.destroy({ transaction });
    await transaction.commit();
    res.status(200).json({ message: 'Petición eliminada' });
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    next(err);
  }
};

exports.listPetitions = async (req, res, next) => {
  try {
    const petitions = await Petition.findAll({
      attributes: ['id', 'title', 'type', 'urgency', 'total_signatures', 'hidden', 'created_at'],
      order: [['created_at', 'DESC']],
    });
    res.json(petitions);
  } catch (err) { next(err); }
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
