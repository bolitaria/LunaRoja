/**
 * Utilidades de fecha/hora en zona Europe/Madrid.
 *
 * Usado por quotaService y otros servicios que necesitan "qué día es hoy
 * en Madrid" o "cuándo es la próxima medianoche en Madrid" sin depender
 * de la TZ del contenedor (que corre en UTC).
 */

const MADRID_TZ = 'Europe/Madrid';

/**
 * Devuelve la fecha actual en Madrid como string 'YYYY-MM-DD'.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
function getMadridDateString(date = new Date()) {
  // 'en-CA' usa YYYY-MM-DD por defecto
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MADRID_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Devuelve la hora actual en Madrid como objeto { h, m, s, secondsToday }.
 * @param {Date} [date=new Date()]
 * @returns {{ h: number, m: number, s: number, secondsToday: number }}
 */
function getMadridTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MADRID_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
  const h = get('hour');
  const m = get('minute');
  const s = get('second');

  return {
    h, m, s,
    secondsToday: h * 3600 + m * 60 + s,
  };
}

/**
 * Devuelve el Date (en UTC) que corresponde a la próxima medianoche en Madrid.
 *
 * Nota: en los 2 cambios de hora del año (marzo y octubre), puede haber
 * una hora de desviación. Aceptable para scheduling de colas.
 *
 * @param {Date} [date=new Date()]
 * @returns {Date}
 */
function getNextMadridMidnight(date = new Date()) {
  const { secondsToday } = getMadridTimeParts(date);
  const secondsUntilMidnight = 86400 - secondsToday;
  return new Date(date.getTime() + secondsUntilMidnight * 1000);
}

/**
 * Milisegundos hasta la próxima medianoche Madrid.
 * @param {Date} [date=new Date()]
 * @returns {number}
 */
function msUntilNextMadridMidnight(date = new Date()) {
  return getNextMadridMidnight(date).getTime() - date.getTime();
}

module.exports = {
  MADRID_TZ,
  getMadridDateString,
  getMadridTimeParts,
  getNextMadridMidnight,
  msUntilNextMadridMidnight,
};
