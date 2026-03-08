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

const randomDelay = (min = 2000, max = 5000) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

async function downloadImage(url, postId) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000
        });
        const ext = path.extname(url).split('?')[0] || '.jpg';
        const filename = `${postId}${ext}`;
        const localPath = path.join(__dirname, '../../uploads/instagram', filename);
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(`/uploads/instagram/${filename}`));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Error descargando imagen para post ${postId}:`, error.message);
        return url;
    }
}

async function scrapeWithPuppeteer(username, limit = 20) {
    const browser = await puppeteer.launch({
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
            '--window-size=1920,1080'
        ],
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
        });
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        console.log(`Navegando a https://www.instagram.com/${username}/...`);
        await page.goto(`https://www.instagram.com/${username}/`, {
            waitUntil: 'networkidle2',
            timeout: 60000,
        });

        // Esperar a que aparezca el contenedor de posts o un mensaje de error
        const bodyHTML = await page.content();
        if (bodyHTML.includes('Esta cuenta es privada') || bodyHTML.includes('Página no disponible')) {
            throw new Error('La cuenta es privada o no existe');
        }

        await page.waitForSelector('article', { timeout: 15000 }).catch(() => null);
        if (!(await page.$('article'))) {
            throw new Error('No se encontraron publicaciones');
        }

        let previousHeight = 0;
        let posts = [];
        while (posts.length < limit) {
            const newPosts = await page.evaluate((limit) => {
                const items = [];
                const links = document.querySelectorAll('article a[href*="/p/"]');
                for (let link of links) {
                    const shortcode = link.href.split('/p/')[1].replace('/', '');
                    const img = link.querySelector('img');
                    if (img) {
                        items.push({
                            shortcode,
                            mediaUrl: img.src,
                            caption: img.alt,
                        });
                    }
                    if (items.length >= limit) break;
                }
                return items;
            }, limit);

            posts = newPosts;

            if (posts.length >= limit) break;

            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await randomDelay(3000, 6000);

            const newHeight = await page.evaluate('document.body.scrollHeight');
            if (newHeight === previousHeight) break;
            previousHeight = newHeight;
        }

        console.log(`Posts encontrados en perfil: ${posts.length}`);

        const detailedPosts = [];
        for (let i = 0; i < Math.min(posts.length, limit); i++) {
            const post = posts[i];
            try {
                console.log(`Obteniendo detalles de ${post.shortcode}...`);
                await page.goto(`https://www.instagram.com/p/${post.shortcode}/`, { waitUntil: 'networkidle2', timeout: 20000 });
                await randomDelay(2000, 4000);

                const details = await page.evaluate(() => {
                    const likesElement = document.querySelector('span.html-span.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1hl2dhg.x16tdsg8.x1vvkbs');
                    const likes = likesElement ? parseInt(likesElement.textContent.replace(/\./g, '')) : 0;
                    const timeElement = document.querySelector('time');
                    const timestamp = timeElement ? timeElement.getAttribute('datetime') : null;
                    const captionElement = document.querySelector('h1 + div span');
                    const fullCaption = captionElement ? captionElement.textContent : '';
                    return { likes, timestamp, fullCaption };
                });

                const localMediaUrl = await downloadImage(post.mediaUrl, post.shortcode);

                detailedPosts.push({
                    postId: post.shortcode,
                    shortcode: post.shortcode,
                    caption: details.fullCaption || post.caption,
                    mediaType: 'image',
                    mediaUrl: localMediaUrl,
                    thumbnailUrl: localMediaUrl,
                    permalink: `https://www.instagram.com/p/${post.shortcode}/`,
                    timestamp: details.timestamp ? new Date(details.timestamp) : new Date(),
                    likes: details.likes || 0,
                    comments: 0,
                });
            } catch (error) {
                console.error(`Error obteniendo detalles del post ${post.shortcode}:`, error.message);
                const localMediaUrl = await downloadImage(post.mediaUrl, post.shortcode);
                detailedPosts.push({
                    postId: post.shortcode,
                    shortcode: post.shortcode,
                    caption: post.caption,
                    mediaType: 'image',
                    mediaUrl: localMediaUrl,
                    thumbnailUrl: localMediaUrl,
                    permalink: `https://www.instagram.com/p/${post.shortcode}/`,
                    timestamp: new Date(),
                    likes: 0,
                    comments: 0,
                });
            }
            await randomDelay(2000, 3000);
        }

        return detailedPosts.slice(0, limit);
    } catch (error) {
        console.error(`Error scraping ${username}:`, error);
        return [];
    } finally {
        await browser.close();
    }
}

module.exports = { scrapeWithPuppeteer };