const { scrapeWithPuppeteer } = require('./instagramScraper');
const { InstagramAccount, InstagramPost } = require('../models');

function hasPublishTag(caption) {
  if (!caption) return false;
  return /#ToBePublished/i.test(caption);
}

async function savePostIfTagged(postData, accountId) {
  if (!hasPublishTag(postData.caption)) {
    console.log(`📌 Publicación ${postData.shortcode} ignorada: no contiene #ToBePublished`);
    return false;
  }

  try {
    await InstagramPost.findOrCreate({
      where: { postId: postData.postId },
      defaults: {
        postId: postData.postId,
        shortcode: postData.shortcode,
        caption: postData.caption,
        mediaType: postData.mediaType,
        mediaUrl: postData.mediaUrl,
        thumbnailUrl: postData.thumbnailUrl,
        permalink: postData.permalink,
        timestamp: postData.timestamp,
        likes: postData.likes || 0,
        comments: postData.comments || 0,
        accountId: accountId,
      },
    });
    console.log(`✅ Publicación ${postData.shortcode} guardada.`);
    return true;
  } catch (error) {
    console.error(`❌ Error guardando publicación ${postData.shortcode}:`, error.message);
    return false;
  }
}

async function scrapeAccount(account) {
  console.log(`📱 Procesando cuenta: @${account.username}`);
  try {
    const posts = await scrapeWithPuppeteer(account.username, 30, 2);
    console.log(`   Obtenidas ${posts.length} publicaciones con Puppeteer`);

    let saved = 0;
    for (const post of posts) {
      const result = await savePostIfTagged(post, account.id);
      if (result) saved++;
    }
    console.log(`   → ${saved}/${posts.length} publicaciones guardadas.`);

    account.lastScraped = new Date();
    await account.save();
  } catch (error) {
    console.error(`   ❌ Error con @${account.username}:`, error.message);
  }
}

async function scrapeAllAccounts() {
  const accounts = await InstagramAccount.findAll({ where: { isActive: true } });
  console.log(`🔍 Iniciando scraping para ${accounts.length} cuentas activas.`);
  for (const account of accounts) {
    await scrapeAccount(account);
  }
  console.log('🏁 Scraping completado.');
}

module.exports = { scrapeAllAccounts };