const { createHash } = require('crypto');

let queue = null;
let redisClient = null;
let isEnabled = false;

const initQueueService = async () => {
  if (queue) return queue;

  const { Queue, Worker } = require('bullmq');
  const IORedis = require('ioredis');

  // Configuración de Redis usando host/port (idéntico al sessionCache)
  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

  const connection = new IORedis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null,
  });

  redisClient = connection;

  queue = new Queue('lunaroja-email', { connection });
  const worker = new Worker('lunaroja-email', async (job) => {
    const { email, templateName, subject, context } = job.data;
    const { sendEmail } = require('./emailService');
    await sendEmail(email, subject, templateName, context);
  }, { connection });

  worker.on('failed', (job, err) => {
    console.error(`Queue job ${job?.id} failed`, err);
  });

  isEnabled = true;
  return queue;
};

const enqueueWelcomeEmail = async (email) => {
  const queueInstance = await initQueueService();
  const jobId = createHash('sha1').update(`welcome:${email}`).digest('hex');
  await queueInstance.add('welcome-email', {
    email,
    templateName: 'welcome',
    subject: '¡Bienvenido a Voces Palestinas por la Justicia!',
    context: { username: email.split('@')[0] },
  }, { jobId });
  return { queued: true, jobId };
};

const getQueueStatus = () => ({ enabled: isEnabled, redisConfigured: Boolean(process.env.REDIS_HOST) });

module.exports = {
  initQueueService,
  enqueueWelcomeEmail,
  getQueueStatus,
};