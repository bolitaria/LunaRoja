require('dotenv').config();
const logger = require('./config/logger');
const { initQueueService, startWorkers } = require('./services/queueService');
const db = require('./models');
const cron = require('node-cron');
const quotaService = require('./services/quotaService');
const fs = require('fs').promises;
const path = require('path');

const startWorker = async () => {
  logger.info('🔧 Iniciando worker de BullMQ...');
  try {
    await db.sequelize.authenticate();
    logger.info('✅ Worker conectado a PostgreSQL');
    initQueueService();
    startWorkers();

    // ────────────────────────────────────────────────────────
    // Cron: reset diario de cuota a medianoche Madrid (00:05)
    // ────────────────────────────────────────────────────────
    cron.schedule('5 0 * * *', async () => {
      try {
        await quotaService.reset();
        logger.info('[cron] Cuota diaria reseteada');
      } catch (err) {
        logger.error({ err }, '[cron] Error reseteando cuota');
      }
    }, { timezone: 'Europe/Madrid' });
    logger.info('⏰ Cron de reset de cuota programado (00:05 Europe/Madrid)');

    // ────────────────────────────────────────────────────────
    // Cron: limpieza de temp files huérfanos (>24h)
    // Los temp de uploads que no se procesen por error quedan en /app/uploads/tmp/.
    // Se borran a las 03:30 Madrid (fuera de horas de uso).
    // ────────────────────────────────────────────────────────
    cron.schedule('30 3 * * *', async () => {
      try {
        const tmpDir = '/app/uploads/tmp';
        const entries = await fs.readdir(tmpDir).catch(() => []);
        const cutoff = Date.now() - 24 * 3600 * 1000;
        let deleted = 0;
        for (const name of entries) {
          const full = path.join(tmpDir, name);
          const stat = await fs.stat(full).catch(() => null);
          if (stat && stat.mtimeMs < cutoff) {
            await fs.unlink(full).catch(() => {});
            deleted++;
          }
        }
        logger.info(`[cron] Limpieza tmp: ${deleted} ficheros borrados`);
      } catch (err) {
        logger.error({ err }, '[cron] Error limpiando tmp');
      }
    }, { timezone: 'Europe/Madrid' });
    logger.info('⏰ Cron de limpieza de temp files programado (03:30 Europe/Madrid)');

    logger.info('✅ Worker listo para procesar jobs');
  } catch (err) {
    logger.error({ err }, '❌ Worker failed');
    process.exit(1);
  }
};

startWorker();
