const cron = require('node-cron');

// Importar de forma segura
let scrapeAllAccounts;
try {
  const scraper = require('../services/instagramScraper');
  scrapeAllAccounts = scraper.scrapeAllAccounts;
} catch (err) {
  console.error('❌ Error cargando el scraper:', err.message);
  console.log('⚠️ El scraping automático no estará disponible.');
}

if (scrapeAllAccounts) {
  console.log('⏰ Programando scraping de Instagram cada 15 minutos...');
  cron.schedule('*/15 * * * *', async () => {
    console.log('🔄 [CRON] Ejecutando scraping de Instagram...');
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