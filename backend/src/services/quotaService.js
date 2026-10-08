/**
 * ============================================================
 * QuotaService — cuota diaria de emails (Brevo free = 300/día)
 * ============================================================
 * Una fila en `email_quota` por día (Europe/Madrid).
 *
 * API:
 *  - getToday()             → fila de hoy (crea si no existe)
 *  - hasCapacity()          → true si sent_count < 300
 *  - increment()            → sent_count++, gestiona side effects al llegar a 300
 *  - getStats()             → para el panel admin
 *  - reset()                → crea fila del día actual (usado por el cron)
 *  - getResetTime()         → Date de próxima medianoche Madrid
 *
 * Al alcanzar las 300 unidades por primera vez:
 *  - Se marca `limit_reached_at`
 *  - Se envía un email al admin (si `ADMIN_ALERT_EMAIL` está configurado)
 *  - Se marca `notified_at` (para no reenviar)
 */

const EmailQuota = require('../models/EmailQuota');
const { getMadridDateString, getNextMadridMidnight } = require('../utils/time');

const DAILY_LIMIT = 300;

// ────────────────────────────────────────────────────────────
// API
// ────────────────────────────────────────────────────────────

/**
 * Devuelve la fila de hoy. La crea si no existe.
 * @returns {Promise<EmailQuota>}
 */
async function getToday() {
  const today = getMadridDateString();
  const [quota] = await EmailQuota.findOrCreate({
    where: { date: today },
    defaults: { date: today, sent_count: 0 },
  });
  return quota;
}

/**
 * ¿Queda cuota para hoy?
 * @returns {Promise<boolean>}
 */
async function hasCapacity() {
  const quota = await getToday();
  return quota.sent_count < DAILY_LIMIT;
}

/**
 * Incrementa el contador y gestiona los side effects al llegar a 300.
 * @returns {Promise<EmailQuota>} La fila actualizada
 */
async function increment() {
  const quota = await getToday();
  const before = quota.sent_count;

  quota.sent_count = before + 1;

  const nowReached = quota.sent_count >= DAILY_LIMIT && before < DAILY_LIMIT;
  if (nowReached && !quota.limit_reached_at) {
    quota.limit_reached_at = new Date();
  }

  await quota.save();

  // Avisar al admin solo la primera vez que se llega al límite
  if (nowReached && !quota.notified_at) {
    quota.notified_at = new Date();
    await quota.save();
    notifyAdminQuotaReached(quota).catch((err) =>
      console.error('[quota] Error notificando al admin:', err.message)
    );
  }

  return quota;
}

/**
 * Estadísticas para el panel admin.
 * @returns {Promise<object>}
 */
async function getStats() {
  const quota = await getToday();
  return {
    date: quota.date,
    count: quota.sent_count,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - quota.sent_count),
    percentage: Math.round((quota.sent_count / DAILY_LIMIT) * 100),
    limitReachedAt: quota.limit_reached_at,
    notifiedAt: quota.notified_at,
    resetAt: getNextMadridMidnight().toISOString(),
  };
}

/**
 * Crea la fila de hoy si no existe. Llamado desde el cron a medianoche.
 * Es idempotente: si la fila ya existe, no hace nada.
 * @returns {Promise<EmailQuota>}
 */
async function reset() {
  const quota = await getToday();
  console.log(`[quota] Nueva fila del día ${quota.date} (idempotente)`);
  return quota;
}

/**
 * Devuelve la fecha de la próxima medianoche Madrid.
 */
function getResetTime() {
  return getNextMadridMidnight();
}

// ────────────────────────────────────────────────────────────
// Notificación al admin
// ────────────────────────────────────────────────────────────

/**
 * Envía un email al admin avisando de que se ha alcanzado el límite
 * diario de envíos. No bloquea ni falla el flujo si no se puede enviar.
 */
async function notifyAdminQuotaReached(quota) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.EMAIL_FROM;
  if (!adminEmail) {
    console.warn('[quota] Límite alcanzado, pero no hay ADMIN_ALERT_EMAIL configurado. Omitiendo email.');
    return;
  }

  // Import lazy para evitar dependencia circular con emailService → quotaService
  const { sendCustomEmail } = require('./emailService');

  const resetAt = getNextMadridMidnight().toISOString();
  const html = `
    <h2>Límite diario de emails alcanzado</h2>
    <p>Se han enviado <strong>${quota.sent_count}</strong> emails hoy (límite: ${DAILY_LIMIT}).</p>
    <p>Los próximos emails se encolarán automáticamente y se enviarán a partir de:</p>
    <p><strong>${resetAt}</strong> (medianoche Europe/Madrid)</p>
    <hr>
    <p style="color:#666;font-size:12px">Este aviso solo se envía una vez por día.</p>
  `;

  await sendCustomEmail(adminEmail, `[LunaRoja] Cuota diaria agotada (${DAILY_LIMIT}/${DAILY_LIMIT})`, html);
  console.log(`[quota] Aviso enviado a ${adminEmail}`);
}

module.exports = {
  getToday,
  hasCapacity,
  increment,
  getStats,
  reset,
  getResetTime,
  DAILY_LIMIT,
};
