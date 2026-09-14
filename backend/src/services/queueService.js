// backend/src/services/queueService.js
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { notifyNewAction, notifyNewCampaign } = require('./notificationService');
const SubscriberAction = require('../models/SubscriberAction');
const SubscribersReminder = require('../models/SubscribersReminder');
const quotaService = require('./quotaService');
const Petition = require('../models/Petition');
const EmailTemplate = require('../models/EmailTemplate');
const { sendPetitionAlert, sendEmailWithTemplate } = require('./emailService');
const storage = require('./storageService');
const documentService = require('./documentService');
const Action = require('../models/Action');
const Campaign = require('../models/Campaign');
const BDS = require('../models/BDS');
const Report = require('../models/Report');

let queues = {};
let workers = [];

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

function getQueue(name) {
  if (!queues[name]) {
    queues[name] = new Queue(name, { connection });
  }
  return queues[name];
}

/**
 * Inicializa el servicio de colas SOLO para encolar jobs.
 * NO crea Workers: eso lo hace startWorkers(), que solo se ejecuta
 * en el contenedor `worker`.
 *
 * El backend llama a esta función al arrancar.
 * El worker llama a initQueueService() + startWorkers().
 */
function initQueueService() {
  console.log('📦 QueueService inicializado (modo encolador, sin workers)');
}

function startWorkers() {
  try {
    const concurrency = parseInt(process.env.QUEUE_CONCURRENCY, 10) || 5;

    // ────────────────────────────────────────────────────────
    // Worker 1: notifications (emails de campañas/acciones)
    // ────────────────────────────────────────────────────────
    const notificationWorker = new Worker(
      'notifications',
      async (job) => {
        const { type } = job.data;

        if (type === 'send-campaign-notifications') {
          const { campaignId, name, description } = job.data;
          const campaign = { id: campaignId, name, description };
          await notifyNewCampaign(campaign, 'campaign');
          return;
        }

        const { actionId, campaignId, bdsId, title, datetime, description, locationType, registrationLink } = job.data;

        const action = {
          id: actionId,
          title,
          datetime,
          description,
          locationType,
          registrationLink,
        };

        let campaign = null;
        let campaignType = null;
        if (campaignId) {
          campaign = { id: campaignId, name: 'Campaña', description: '', color: '#E53E3E' };
          campaignType = 'campaign';
        } else if (bdsId) {
          campaign = { id: bdsId, name: 'Campaña BDS', description: '', color: '#E53E3E' };
          campaignType = 'bds';
        }

        await notifyNewAction(action, campaign, campaignType);

        const followerActions = await SubscriberAction.findAll({
          where: { actionId, isFollowing: true },
        });
        const reminderDate = new Date(datetime);
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(12, 0, 0, 0);

        for (const rel of followerActions) {
          await SubscribersReminder.create({
            actionId,
            subscriberId: rel.subscriberId,
            scheduledAt: reminderDate,
            sent: false,
          });
        }
      },
      { connection, concurrency }
    );

    notificationWorker.on('completed', (job) => {
      console.log(`✅ [notifications] Job ${job.id} completado`);
    });
    notificationWorker.on('failed', (job, err) => {
      console.error(`❌ [notifications] Job ${job.id} falló:`, err.message);
    });

    workers.push(notificationWorker);
    console.log(`📦 Cola de notificaciones inicializada (concurrencia: ${concurrency})`);

    // ────────────────────────────────────────────────────────
    // Worker 2: petition-signature-email
    // Envía emails de firmas de peticiones diferidos por cuota agotada.
    // Los jobs vienen con delay hasta la próxima medianoche Madrid.
    // El payload se purga al completar (privacidad del firmante).
    // ────────────────────────────────────────────────────────
    const petitionEmailWorker = new Worker(
      'petition-signature-email',
      async (job) => {
        const { petitionId, targetEmails, templateId, colors, emailData } = job.data;

        if (!(await quotaService.hasCapacity())) {
          throw new Error('Cuota agotada, reintentando');
        }

        const petition = await Petition.findByPk(petitionId);
        if (!petition) {
          console.warn(`[petition-signature-email] Petition ${petitionId} no encontrada, descartando job`);
          return;
        }

        let sent = false;

        if (templateId) {
          const template = await EmailTemplate.findByPk(templateId);
          if (template) {
            const mergedColors = {
              headerColor: colors?.headerColor || template.headerColor,
              buttonColor: colors?.buttonColor || template.buttonColor,
              footerColor: colors?.footerColor || template.footerColor,
              backgroundColor: colors?.backgroundColor || template.backgroundColor,
            };
            sent = await sendEmailWithTemplate(
              targetEmails,
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

        if (!sent) {
          throw new Error('Envío de email fallido');
        }

        await quotaService.increment();
        console.log(`[petition-signature-email] Job ${job.id} completado para petition ${petitionId}`);
      },
      {
        connection,
        concurrency: 1,
      }
    );

    petitionEmailWorker.on('completed', (job) => {
      console.log(`✅ [petition-signature-email] Job ${job.id} completado`);
    });
    petitionEmailWorker.on('failed', (job, err) => {
      console.error(`❌ [petition-signature-email] Job ${job?.id} falló:`, err.message);
    });

    workers.push(petitionEmailWorker);
    console.log(`📦 Cola de emails diferidos de peticiones inicializada`);

    // ────────────────────────────────────────────────────────
    // Worker 3: entity-post-process (genérico)
    // Procesa imágenes y documentos de CUALQUIER entidad (action,
    // campaign, bds, report). Un solo worker para todos.
    // ────────────────────────────────────────────────────────
    const ENTITY_MODELS = {
      action: Action,
      campaign: Campaign,
      bds: BDS,
      report: Report,
    };
    const ENTITY_NOTIFY = {
      action: true,
      campaign: true,
      bds: false,
      report: false,
    };

    const entityPostProcessWorker = new Worker(
      'entity-post-process',
      async (job) => {
        const { entityType, entityId, userId, featuredImage, galleryImages, documents } = job.data;
        const tempPaths = [];

        const Model = ENTITY_MODELS[entityType];
        if (!Model) throw new Error(`entityType desconocido: ${entityType}`);

        try {
          const entity = await Model.findByPk(entityId);
          if (!entity) throw new Error(`${entityType} ${entityId} no existe`);

          // 1. Featured (solo si la entidad lo soporta)
          let imageUrl = entity.imageUrl;
          if (featuredImage) {
            tempPaths.push(featuredImage.path);
            const saved = await storage.saveFeatured(entityType, entityId, featuredImage);
            const optimized = await storage.optimizeImage(saved.filePath);
            imageUrl = optimized.filePath;
          }

          // 2. Galería (solo actions la usan, pero el código es genérico)
          const newGalleryUrls = [];
          if (Array.isArray(galleryImages) && galleryImages.length > 0) {
            for (const img of galleryImages) {
              tempPaths.push(img.path);
              const saved = await storage.saveGalleryImage(entityType, entityId, img);
              const optimized = await storage.optimizeImage(saved.filePath);
              newGalleryUrls.push(optimized.filePath);
            }
          }

          // 3. Documentos
          for (const doc of documents || []) {
            tempPaths.push(doc.path);
            const saved = await storage.saveDocument(entityType, entityId, doc, doc.name);

            const fkField = {
              action: 'actionId',
              campaign: 'campaignId',
              bds: 'bdsId',
              report: 'reportId',
            }[entityType];

            await documentService.Document.create({
              title: doc.name,
              source: 'upload',
              filePath: saved.filePath,
              mimeType: saved.mimeType,
              fileSize: saved.fileSize,
              visibility: doc.visibility,
              [fkField]: entityId,
              uploadedBy: userId || null,
            });
          }

          // 4. Actualizar entidad
          const existingGallery = Array.isArray(entity.galleryImages) ? entity.galleryImages : [];
          const finalGallery = [...existingGallery, ...newGalleryUrls];

          const updates = {
            status: 'published',
            processingError: null,
          };
          if (featuredImage) updates.imageUrl = imageUrl;
          if (newGalleryUrls.length > 0) updates.galleryImages = finalGallery;

          await entity.update(updates);

          // 5. Notificación (solo action y campaign)
          if (ENTITY_NOTIFY[entityType]) {
            if (entityType === 'action') {
              await getQueue('notifications').add('send-action-notifications', {
                actionId: entity.id,
                campaignId: entity.campaignId,
                bdsId: entity.bdsId,
                title: entity.title,
                datetime: entity.datetime,
                description: entity.description,
                locationType: entity.locationType,
                registrationLink: entity.registrationLink,
              });
            } else if (entityType === 'campaign') {
              await getQueue('notifications').add('send-campaign-notifications', {
                type: 'send-campaign-notifications',
                campaignId: entity.id,
                name: entity.name,
                description: entity.description,
              });
            }
          }

          // 6. Limpiar temporales
          await storage.cleanupTemps(tempPaths);
          console.log(`✅ [entity-post-process] ${entityType} ${entityId} publicada`);
        } catch (err) {
          try {
            await Model.update(
              { status: 'error', processingError: err.message },
              { where: { id: entityId } }
            );
          } catch (e) { /* noop */ }
          console.error(`❌ [entity-post-process] Error en ${entityType} ${entityId}:`, err.message);
          throw err;
        }
      },
      {
        connection,
        concurrency: 1,
        limiter: { max: 5, duration: 60000 },
      }
    );

    entityPostProcessWorker.on('completed', (job) => {
      console.log(`✅ [entity-post-process] Job ${job.id} completado`);
    });
    entityPostProcessWorker.on('failed', (job, err) => {
      console.error(`❌ [entity-post-process] Job ${job?.id} falló:`, err.message);
    });

    workers.push(entityPostProcessWorker);
    console.log(`📦 Cola de procesamiento de entidades inicializada`);

  } catch (err) {
    console.error('❌ Error al inicializar colas:', err.message);
  }
}

async function getQueueMetrics() {
  const metrics = [];
  for (const [name, queue] of Object.entries(queues)) {
    try {
      const counts = await queue.getJobCounts(
        'waiting', 'active', 'completed', 'failed', 'delayed', 'paused'
      );
      metrics.push({ name, ...counts });
    } catch (err) {
      metrics.push({ name, error: err.message });
    }
  }
  return metrics;
}

module.exports = {
  getQueue,
  initQueueService,
  startWorkers,
  getQueueMetrics,
  connection,
};
