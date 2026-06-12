// En instagramScraper.js (o donde esté la función de descarga)
const path = require('path');
const fs = require('fs');
const axios = require('axios');

async function downloadMedia(url, shortcode) {
  try {
    const cleanId = shortcode.replace(/[^a-zA-Z0-9_-]/g, '');
    // Determinar extensión (puede ser .jpg, .png, .mp4, etc.)
    let ext = 'jpg';
    if (url.match(/\.(mp4|mov|webm)(\?|$)/i)) ext = 'mp4';
    else if (url.match(/\.(png|gif|webp)(\?|$)/i)) ext = 'png';
    else if (url.match(/\.(jpe?g)(\?|$)/i)) ext = 'jpg';

    const filename = `${cleanId}.${ext}`;
    // Guardar dentro de public/uploads/instagram
    const publicDir = path.join(process.cwd(), 'public/uploads/instagram');
    const localPath = path.join(publicDir, filename);
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0 ...' } // mismo user agent
    });

    const writer = fs.createWriteStream(localPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`/uploads/instagram/${filename}`));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error descargando media para ${shortcode}:`, error.message);
    return url; // fallback a URL original (puede no funcionar por CORS)
  }
}