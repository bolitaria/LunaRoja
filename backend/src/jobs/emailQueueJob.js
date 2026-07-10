const cron = require('node-cron');
const { EmailQueue, EmailQuota } = require('../models');
const { sendPetitionAlert } = require('../services/emailService');
const { Op } = require('sequelize');

const DAILY_LIMIT = 300; // Límite de Brevo gratuito

async function processEmailQueue() {
  const today = new Date().toISOString().split('T')[0];

  // Obtener o crear la cuota de hoy
  let [quota] = await EmailQuota.findOrCreate({
    where: { date: today },
    defaults: { sent_count: 0 },
  });

  const remaining = DAILY_LIMIT - quota.sent_count;
  if (remaining <= 0) {
    console.log(`📧 Cuota diaria agotada (${quota.sent_count}/${DAILY_LIMIT}). No se envían más correos.`);
    return;
  }

  // Buscar correos pendientes, ordenados por fecha más antigua primero
  const pendingEmails = await EmailQueue.findAll({
    where: { status: 'pending' },
    include: [{ model: require('../models/Petition'), as: 'petition' }],
    order: [['created_at', 'ASC']],
    limit: remaining,
  });

  if (pendingEmails.length === 0) {
    console.log('📧 No hay correos pendientes en la cola.');
    return;
  }

  for (const queueItem of pendingEmails) {
    try {
      const petition = queueItem.petition;
      if (!petition) {
        // La petición ya no existe, marcar como fallido
        queueItem.status = 'failed';
        await queueItem.save();
        continue;
      }
      // Enviar el correo
      const result = await sendPetitionAlert(petition, queueItem.signer_data);
      if (result.success) {
        queueItem.status = 'sent';
        queueItem.sent_at = new Date();
        await queueItem.save();
        quota.sent_count += 1;
        await quota.save();
        console.log(`✅ Correo enviado para petición ${petition.id}`);
      } else if (result.quotaExceeded) {
        // Si incluso ahora se supera la cuota, paramos
        console.warn('⚠️ Cuota alcanzada durante el procesamiento de la cola.');
        break;
      } else {
        // Otro error, marcar como fallido y continuar
        queueItem.status = 'failed';
        await queueItem.save();
        console.error(`❌ Falló envío a ${queueItem.id}`);
      }
    } catch (err) {
      console.error(`❌ Error procesando cola ${queueItem.id}:`, err);
      queueItem.status = 'failed';
      await queueItem.save();
    }
    // Si ya alcanzamos el límite, salir
    if (quota.sent_count >= DAILY_LIMIT) break;
  }
}

// Ejecutar cada hora, pero solo enviará si hay cuota disponible
cron.schedule('0 * * * *', () => {
  console.log('⏳ Ejecutando job de cola de correos...');
  processEmailQueue().catch(err => console.error('Error en emailQueueJob:', err));
});

// También ejecutar inmediatamente al iniciar el servidor (opcional)
setTimeout(() => {
  processEmailQueue().catch(err => console.error('Error inicial en emailQueueJob:', err));
}, 5000);

console.log('📧 Job de cola de correos programado (cada hora).');
