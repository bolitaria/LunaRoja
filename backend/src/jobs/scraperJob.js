const cron = require('node-cron');

let scrapeAllAccounts;
try {
  const scraper = require('../services/instagramScraper');
  scrapeAllAccounts = scraper.scrapeAllAccounts;
} catch (err) {
  console.error('❌ Error cargando el scraper:', err.message);
  console.log('⚠️ El scraping automático no estará disponible.');
}

if (scrapeAllAccounts) {
  console.log('⏰ Programando scraping de Instagram a las 11:00, 16:00 y 21:00...');
  cron.schedule('0 11,16,21 * * *', async () => {
    console.log('🔄 [CRON] Ejecutando scraping programado...');
    try {
      await scrapeAllAccounts();
      console.log('✅ [CRON] Scraping completado.');
    } catch (error) {
      console.error('❌ [CRON] Error en scraping:', error);
    }
  });
} else {
  console.log('⏸️ Scraping automático desactivado.');
}