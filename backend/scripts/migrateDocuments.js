require('dotenv').config();
const mongoose = require('mongoose');
const Action = require('../models/Action');
const Document = require('../models/Document');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const actions = await Action.find({ document: { $exists: true, $ne: null } });
  for (const action of actions) {
    await Document.create({
      title: `Documento público de ${action.title}`,
      fileUrl: action.document,
      isPublic: true,
      campaignId: action.campaignId || null,
      actionId: action._id,
      createdAt: action.datetime || new Date(),
    });
  }
  const actionsWithLink = await Action.find({ documentLink: { $exists: true, $ne: null } });
  for (const action of actionsWithLink) {
    await Document.create({
      title: `Documentación interna de ${action.title}`,
      fileUrl: action.documentLink,
      isPublic: false,
      campaignId: action.campaignId || null,
      actionId: action._id,
      createdAt: action.datetime || new Date(),
    });
  }
  console.log('Migración de documentos completada');
  process.exit(0);
});