const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
];

const randomDelay = (min = 2000, max = 5000) =>
  new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

/**
 * Descarga un archivo multimedia a la carpeta uploads/instagram.
 */
async function downloadMedia(url, shortcode) {
  try {
    const cleanId = shortcode.replace(/[^a-zA-Z0-9_-]/g, '');
    let ext = 'jpg';
    if (url.match(/\.(mp4|mov|webm)(\?|$)/i)) ext = 'mp4';
    else if (url.match(/\.(png|gif|webp)(\?|$)/i)) ext = 'png';
    else if (url.match(/\.(jpe?g)(\?|$)/i)) ext = 'jpg';

    const filename = `${cleanId}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'uploads/instagram');
    const localPath = path.join(uploadDir, filename);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 20000,
      headers: { 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)] }
    });

    const writer = fs.createWriteStream(localPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`/uploads/instagram/${filename}`));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error descargando media para ${shortcode}:`, error.message);
    return url;
  }
}

/**
 * Scraping principal de una cuenta.
 */
async function scrapeWithPuppeteer(username, limit = 20, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
      });

      const page = await browser.newPage();
      await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' });
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      await page.goto(`https://www.instagram.com/${username}/`, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      const bodyHTML = await page.content();
      if (bodyHTML.includes('Esta cuenta es privada') || bodyHTML.includes('Página no disponible')) {
        throw new Error('La cuenta es privada o no existe');
      }

      await page.waitForSelector('article', { timeout: 15000 }).catch(() => null);
      if (!(await page.$('article'))) {
        throw new Error('No se encontraron publicaciones');
      }

      // Obtener lista de enlaces a posts
      let posts = [];
      let previousHeight = 0;
      while (posts.length < limit) {
        const newPosts = await page.evaluate(() => {
          const items = [];
          const links = document.querySelectorAll('article a[href*="/p/"]');
          for (let link of links) {
            const shortcode = link.href.split('/p/')[1].replace('/', '');
            items.push({ shortcode });
            if (items.length >= 30) break;
          }
          return items;
        });
        posts = newPosts;
        if (posts.length >= limit) break;
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await randomDelay(3000, 6000);
        const newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight) break;
        previousHeight = newHeight;
      }

      const detailedPosts = [];
      for (let i = 0; i < Math.min(posts.length, limit); i++) {
        const post = posts[i];
        try {
          console.log(`Obteniendo detalles de ${post.shortcode}...`);
          await page.goto(`https://www.instagram.com/p/${post.shortcode}/`, {
            waitUntil: 'networkidle2',
            timeout: 20000,
          });
          await randomDelay(2000, 4000);

          const details = await page.evaluate(() => {
            const likesElement = document.querySelector('span.html-span.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1hl2dhg.x16tdsg8.x1vvkbs');
            const likes = likesElement ? parseInt(likesElement.textContent.replace(/\./g, '')) : 0;
            const timeElement = document.querySelector('time');
            const timestamp = timeElement ? timeElement.getAttribute('datetime') : null;
            const captionElement = document.querySelector('h1 + div span');
            const fullCaption = captionElement ? captionElement.textContent : '';

            const videoElement = document.querySelector('video');
            const mediaType = videoElement ? 'video' : 'image';
            let mediaUrl = '';
            let thumbnailUrl = '';

            if (mediaType === 'video') {
              mediaUrl = videoElement.src;
              thumbnailUrl = videoElement.getAttribute('poster') || '';
            } else {
              const imgElement = document.querySelector('article img');
              mediaUrl = imgElement ? imgElement.src : '';
              thumbnailUrl = mediaUrl;
            }

            return { likes, timestamp, fullCaption, mediaType, mediaUrl, thumbnailUrl };
          });

          const localMediaUrl = await downloadMedia(details.mediaUrl, post.shortcode);
          let localThumbnailUrl = localMediaUrl;
          if (details.mediaType === 'video' && details.thumbnailUrl) {
            localThumbnailUrl = await downloadMedia(details.thumbnailUrl, `${post.shortcode}_thumb`);
          }

          detailedPosts.push({
            postId: post.shortcode,
            shortcode: post.shortcode,
            caption: details.fullCaption,
            mediaType: details.mediaType,
            mediaUrl: localMediaUrl,
            thumbnailUrl: localThumbnailUrl,
            permalink: `https://www.instagram.com/p/${post.shortcode}/`,
            timestamp: details.timestamp ? new Date(details.timestamp) : new Date(),
            likes: details.likes || 0,
            comments: 0,
          });
        } catch (error) {
          console.error(`Error obteniendo detalles del post ${post.shortcode}:`, error.message);
          const fallbackUrl = `https://www.instagram.com/p/${post.shortcode}/media/?size=l`;
          const localUrl = await downloadMedia(fallbackUrl, post.shortcode);
          detailedPosts.push({
            postId: post.shortcode,
            shortcode: post.shortcode,
            caption: '',
            mediaType: 'image',
            mediaUrl: localUrl,
            thumbnailUrl: localUrl,
            permalink: `https://www.instagram.com/p/${post.shortcode}/`,
            timestamp: new Date(),
            likes: 0,
            comments: 0,
          });
        }
        await randomDelay(2000, 3000);
      }

      await browser.close();
      return detailedPosts.slice(0, limit);
    } catch (error) {
      lastError = error;
      console.error(`Intento ${attempt} falló:`, error.message);
      if (browser) await browser.close().catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw lastError;
}

/**
 * Procesa una cuenta individual.
 */
async function scrapeAccount(account) {
  // Importar modelo directamente para evitar dependencias circulares
  const InstagramPost = require('../models/InstagramPost');
  console.log(`📱 Procesando cuenta: @${account.username}`);
  try {
    const posts = await scrapeWithPuppeteer(account.username, 30, 2);
    console.log(`   Obtenidas ${posts.length} publicaciones con Puppeteer`);

    let saved = 0;
    for (const post of posts) {
      try {
        await InstagramPost.findOrCreate({
          where: { postId: post.postId },
          defaults: {
            postId: post.postId,
            shortcode: post.shortcode,
            caption: post.caption,
            mediaType: post.mediaType,
            mediaUrl: post.mediaUrl,
            thumbnailUrl: post.thumbnailUrl,
            permalink: post.permalink,
            timestamp: post.timestamp,
            likes: post.likes || 0,
            comments: post.comments || 0,
            accountId: account.id,
          },
        });
        saved++;
      } catch (err) {
        console.error(`Error guardando publicación ${post.shortcode}:`, err.message);
      }
    }
    console.log(`   → ${saved}/${posts.length} publicaciones guardadas.`);

    account.lastScraped = new Date();
    await account.save();
  } catch (error) {
    console.error(`   ❌ Error con @${account.username}:`, error.message);
  }
}

/**
 * Itera sobre todas las cuentas activas.
 */
async function scrapeAllAccounts() {
  // Importar modelo directamente
  const InstagramAccount = require('../models/InstagramAccount');
  const accounts = await InstagramAccount.findAll({ where: { isActive: true } });
  console.log(`🔍 Iniciando scraping para ${accounts.length} cuentas activas.`);
  for (const account of accounts) {
    await scrapeAccount(account);
  }
  console.log('🏁 Scraping completado.');
}

module.exports = {
  scrapeAllAccounts,
  scrapeAccount,
  scrapeWithPuppeteer,
  downloadMedia,
};