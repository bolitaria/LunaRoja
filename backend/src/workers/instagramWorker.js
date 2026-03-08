const cron = require('node-cron');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const InstagramAccount = require('../models/InstagramAccount');
const InstagramPost = require('../models/InstagramPost');
const { scrapeWithPuppeteer } = require('../services/instagramPuppeteer');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

cron.schedule('0 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Iniciando worker de Instagram...`);
  try {
    const accounts = await InstagramAccount.findAll({ where: { isActive: true } });
    if (accounts.length === 0) {
      console.log('No hay cuentas activas.');
      return;
    }

    for (const account of accounts) {
      console.log(`Scrapeando @${account.username}...`);
      try {
        const posts = await scrapeWithPuppeteer(account.username, 50);

        for (const post of posts) {
          const existing = await InstagramPost.findOne({ where: { postId: post.postId } });
          if (!existing) {
            await InstagramPost.create({
              ...post,
              accountId: account.id,
            });
            console.log(`Nuevo post guardado: ${post.shortcode}`);
          }
        }

        const currentIds = posts.map(p => p.postId);

        const postsToDelete = await InstagramPost.findAll({
          where: {
            accountId: account.id,
            postId: { [Op.notIn]: currentIds }
          }
        });

        for (const post of postsToDelete) {
          if (post.mediaUrl && post.mediaUrl.startsWith('/uploads/instagram/')) {
            const filename = path.basename(post.mediaUrl);
            const filePath = path.join(__dirname, '../../uploads/instagram', filename);
            fs.unlink(filePath, (err) => {
              if (err) console.error(`Error al eliminar imagen ${filename}:`, err.message);
              else console.log(`Imagen eliminada: ${filename}`);
            });
          }
          await post.destroy();
          console.log(`Post eliminado: ${post.shortcode}`);
        }

        account.lastScraped = new Date();
        await account.save();
        console.log(`@${account.username} actualizado (${posts.length} posts). Eliminados: ${postsToDelete.length}`);
      } catch (error) {
        console.error(`Error con @${account.username}:`, error.message);
      }

      await delay(5000 + Math.random() * 5000);
    }
    console.log(`[${new Date().toISOString()}] Worker finalizado.`);
  } catch (error) {
    console.error('Error general en worker:', error);
  }
});