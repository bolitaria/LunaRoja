/**
 * Scraper de artículos con Open Graph / Twitter Cards.
 * Extrae metadatos públicos sin guardar el HTML completo.
 *
 * Seguridad:
 * - Bloquea IPs privadas (SSRF)
 * - Solo http y https
 * - Timeout 5s
 * - Máx 1MB de HTML
 * - User-Agent identificable
 */
const dns = require('dns').promises;
const net = require('net');
const cheerio = require('cheerio');

const TIMEOUT_MS = 5000;
const MAX_BYTES = 1024 * 1024; // 1 MB
const USER_AGENT = 'LunaRojaBot/1.0 (+https://lunaroja.org)';

/**
 * Verifica que una IP no sea privada / loopback / link-local.
 */
function isPrivateIP(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA
    if (lower.startsWith('fe80')) return true; // link-local
    if (lower.startsWith('::ffff:')) {
      const v4 = lower.replace('::ffff:', '');
      if (net.isIPv4(v4)) return isPrivateIP(v4);
    }
    return false;
  }
  return true; // si no es IP válida, bloquear
}

/**
 * Valida y resuelve una URL, comprobando que no apunte a red interna.
 */
async function validateUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('URL inválida');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Solo se permiten URLs http o https');
  }
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) {
    throw new Error('Host no permitido');
  }
  // Resolver DNS y comprobar todas las IPs
  let addresses;
  try {
    addresses = await dns.lookup(url.hostname, { all: true });
  } catch {
    throw new Error('No se pudo resolver el dominio');
  }
  for (const { address } of addresses) {
    if (isPrivateIP(address)) {
      throw new Error('La URL apunta a una red privada (bloqueado por seguridad)');
    }
  }
  return url;
}

/**
 * Extrae el valor de un meta tag por property o name.
 */
function pickMeta($, selectors) {
  for (const sel of selectors) {
    const el = $(sel).first();
    if (el.length) {
      const content = el.attr('content');
      if (content && content.trim()) return content.trim();
    }
  }
  return null;
}

/**
 * Scrapea una URL y devuelve los metadatos OG / Twitter / HTML.
 *
 * @param {string} rawUrl
 * @returns {Promise<{title, description, image, source, publishedAt, url}>}
 */
async function scrapeArticle(rawUrl) {
  const url = await validateUrl(rawUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.5',
      },
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`El servidor respondió ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error('La URL no devuelve HTML');
  }

  // Leer con límite de tamaño
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) {
      reader.cancel().catch(() => {});
      throw new Error('La página es demasiado grande');
    }
    chunks.push(value);
  }
  const buffer = Buffer.concat(chunks);
  const html = buffer.toString('utf8');

  const $ = cheerio.load(html);

  const title =
    pickMeta($, [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'meta[name="title"]',
    ]) ||
    $('title').first().text().trim() ||
    null;

  const description =
    pickMeta($, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]) || null;

  // ─── Imagen: múltiples estrategias en cascada ───
  // 1. Open Graph / Twitter Cards
  let image = pickMeta($, [
    'meta[property="og:image:secure_url"]',
    'meta[property="og:image:url"]',
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:src"]',
    'meta[itemprop="image"]',
  ]);

  // 2. <link rel="image_src">
  if (!image) {
    image = $('link[rel="image_src"]').first().attr('href') || null;
  }

  // 3. JSON-LD (script type="application/ld+json")
  if (!image) {
    $('script[type="application/ld+json"]').each((_, el) => {
      if (image) return;
      try {
        const data = JSON.parse($(el).html() || '{}');
        const candidates = Array.isArray(data) ? data : [data];
        for (const item of candidates) {
          const img = item?.image;
          if (typeof img === 'string') { image = img; break; }
          if (Array.isArray(img) && img[0]) {
            image = typeof img[0] === 'string' ? img[0] : img[0]?.url;
            if (image) break;
          }
          if (img && typeof img === 'object' && img.url) {
            image = img.url;
            break;
          }
        }
      } catch { /* ignore */ }
    });
  }

  // 4. Primera imagen grande dentro de <article> o <main>
  if (!image) {
    const candidates = $('article img, main img, [itemprop="articleBody"] img, .article-body img')
      .filter((_, el) => {
        const w = parseInt($(el).attr('width') || '0', 10);
        const h = parseInt($(el).attr('height') || '0', 10);
        // Descartar iconos/logos pequeños
        if (w && w < 200) return false;
        if (h && h < 200) return false;
        return true;
      })
      .first();

    image = candidates.attr('src') || candidates.attr('data-src') || candidates.attr('data-lazy-src') || null;
  }

  const source =
    pickMeta($, [
      'meta[property="og:site_name"]',
      'meta[name="application-name"]',
      'meta[name="publisher"]',
    ]) || url.hostname.replace(/^www\./, '');

  const publishedAtRaw =
    pickMeta($, [
      'meta[property="article:published_time"]',
      'meta[name="article:published_time"]',
      'meta[name="pubdate"]',
      'meta[name="publishdate"]',
      'meta[name="date"]',
      'meta[itemprop="datePublished"]',
    ]) || null;

  let publishedAt = null;
  if (publishedAtRaw) {
    const d = new Date(publishedAtRaw);
    if (!isNaN(d.getTime())) publishedAt = d.toISOString();
  }

  // Normalizar imagen relativa a absoluta
  let absoluteImage = null;
  if (image) {
    try {
      absoluteImage = new URL(image, url).toString();
    } catch {
      absoluteImage = null;
    }
  }

  return {
    title,
    description,
    image: absoluteImage,
    source,
    publishedAt,
    url: url.toString(),
  };
}

module.exports = { scrapeArticle, isPrivateIP, validateUrl };
